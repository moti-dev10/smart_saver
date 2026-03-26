from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.database import get_db
from app.models.models import Product, Deal, Retailer, Club, User, UserRole, DealReport, ReportStatus
from app.auth import require_editor, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Products ───────────────────────────────────────────────────────────────

class ProductIn(BaseModel):
    name: str
    category: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None


@router.get("/products")
def list_products(db: Session = Depends(get_db), _=Depends(require_editor)):
    products = db.query(Product).all()
    return [{"id": p.id, "name": p.name, "category": p.category, "barcode": p.barcode,
             "image_url": p.image_url, "deals": len(p.deals)} for p in products]


@router.post("/products", status_code=201)
def create_product(body: ProductIn, db: Session = Depends(get_db), _=Depends(require_editor)):
    p = Product(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, **body.model_dump(), "deals": 0}


@router.put("/products/{product_id}")
def update_product(product_id: int, body: ProductIn, db: Session = Depends(get_db), _=Depends(require_editor)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "מוצר לא נמצא")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.commit()
    return {"id": p.id, **body.model_dump()}


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "מוצר לא נמצא")
    db.delete(p)
    db.commit()


# ── Deals ──────────────────────────────────────────────────────────────────

class DealIn(BaseModel):
    product_id: int
    retailer_id: int
    club_id: Optional[int] = None
    regular_price: float
    deal_price: float
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


@router.get("/deals")
def list_deals(db: Session = Depends(get_db), _=Depends(require_editor)):
    deals = db.query(Deal).all()
    return [{
        "id": d.id,
        "product": d.product.name,
        "product_id": d.product_id,
        "retailer": d.retailer.name,
        "retailer_id": d.retailer_id,
        "club": d.club.name if d.club else None,
        "club_id": d.club_id,
        "regular_price": d.regular_price,
        "deal_price": d.deal_price,
        "valid_from": str(d.valid_from) if d.valid_from else None,
        "valid_until": str(d.valid_until) if d.valid_until else None,
    } for d in deals]


@router.post("/deals", status_code=201)
def create_deal(body: DealIn, db: Session = Depends(get_db), _=Depends(require_editor)):
    d = Deal(**body.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id, **body.model_dump()}


@router.put("/deals/{deal_id}")
def update_deal(deal_id: int, body: DealIn, db: Session = Depends(get_db), _=Depends(require_editor)):
    d = db.query(Deal).filter(Deal.id == deal_id).first()
    if not d:
        raise HTTPException(404, "עסקה לא נמצאה")
    for k, v in body.model_dump().items():
        setattr(d, k, v)
    db.commit()
    return {"id": d.id, **body.model_dump()}


@router.delete("/deals/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db), _=Depends(require_editor)):
    d = db.query(Deal).filter(Deal.id == deal_id).first()
    if not d:
        raise HTTPException(404, "עסקה לא נמצאה")
    db.delete(d)
    db.commit()


# ── Retailers & Clubs ──────────────────────────────────────────────────────

@router.get("/retailers")
def list_retailers(db: Session = Depends(get_db), _=Depends(require_editor)):
    retailers = db.query(Retailer).all()
    return [{"id": r.id, "name": r.name, "affiliate_url": r.affiliate_url,
             "clubs": [{"id": c.id, "name": c.name} for c in r.clubs]} for r in retailers]


class RetailerIn(BaseModel):
    name: str
    affiliate_url: Optional[str] = None
    logo_url: Optional[str] = None


@router.post("/retailers", status_code=201)
def create_retailer(body: RetailerIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    r = Retailer(**body.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, **body.model_dump(), "clubs": []}


# ── Users ──────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "name": u.name, "role": u.role,
             "clubs": len(u.user_clubs),
             "created_at": str(u.created_at.date()) if u.created_at else None} for u in users]


class RoleIn(BaseModel):
    role: UserRole


@router.patch("/users/{user_id}/role")
def set_role(user_id: int, body: RoleIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "משתמש לא נמצא")
    u.role = body.role
    db.commit()
    return {"id": u.id, "role": u.role}


# ── Reports ────────────────────────────────────────────────────────────────

@router.get("/reports")
def list_reports(db: Session = Depends(get_db), _=Depends(require_editor)):
    reports = db.query(DealReport).order_by(DealReport.created_at.desc()).all()
    return [{
        "id": r.id,
        "user": r.user.email if r.user else None,
        "type": r.report_type,
        "product": r.deal.product.name if r.deal else None,
        "retailer": r.deal.retailer.name if r.deal else None,
        "notes": r.notes,
        "suggested_price": r.suggested_price,
        "suggested_retailer": r.suggested_retailer,
        "suggested_club": r.suggested_club,
        "status": r.status,
        "created_at": str(r.created_at.date()) if r.created_at else None,
    } for r in reports]


class ReportStatusIn(BaseModel):
    status: ReportStatus


@router.patch("/reports/{report_id}")
def update_report_status(report_id: int, body: ReportStatusIn, db: Session = Depends(get_db), _=Depends(require_editor)):
    r = db.query(DealReport).filter(DealReport.id == report_id).first()
    if not r:
        raise HTTPException(404, "דיווח לא נמצא")
    r.status = body.status
    db.commit()
    return {"id": r.id, "status": r.status}


# ── Stats ──────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_editor)):
    from datetime import date as dt
    today = dt.today()
    return {
        "products": db.query(Product).count(),
        "deals": db.query(Deal).filter(Deal.valid_until >= today).count(),
        "users": db.query(User).count(),
        "pending_reports": db.query(DealReport).filter(DealReport.status == ReportStatus.pending).count(),
    }
