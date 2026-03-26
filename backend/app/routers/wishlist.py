from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.models import WishlistItem, Product, Deal, User
from app.auth import require_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


# ── Schemas ────────────────────────────────────────────────────────────────

class WishlistProductItem(BaseModel):
    product_id: int
    product_name: str
    product_category: Optional[str]
    product_image: Optional[str]
    best_price: float
    added_at: datetime

    model_config = {"from_attributes": True}


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[WishlistProductItem])
def get_wishlist(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == current_user.id)
        .options(joinedload(WishlistItem.product))
        .order_by(WishlistItem.added_at.desc())
        .all()
    )

    result = []
    for item in items:
        product = item.product
        deals = db.query(Deal).filter(Deal.product_id == product.id).all()
        best_price = min((d.deal_price for d in deals), default=0)
        result.append(WishlistProductItem(
            product_id=product.id,
            product_name=product.name,
            product_category=product.category,
            product_image=product.image_url,
            best_price=best_price,
            added_at=item.added_at,
        ))
    return result


@router.get("/ids")
def get_wishlist_ids(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """רשימת מזהי מוצרים ברשימת המועדפים — לצורך עדכון כפתורי ❤️"""
    items = db.query(WishlistItem.product_id).filter(
        WishlistItem.user_id == current_user.id
    ).all()
    return {"ids": [i.product_id for i in items]}


@router.post("/{product_id}", status_code=204)
def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="מוצר לא נמצא")

    exists = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id,
    ).first()

    if not exists:
        db.add(WishlistItem(user_id=current_user.id, product_id=product_id))
        db.commit()


@router.delete("/{product_id}", status_code=204)
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id,
    ).first()

    if item:
        db.delete(item)
        db.commit()
