from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.models import Club, Retailer, UserClub, DealClick, Deal, Product, User
from app.auth import require_user

router = APIRouter(prefix="/profile", tags=["profile"])


# ── Schemas ────────────────────────────────────────────────────────────────

class ClubInfo(BaseModel):
    id: int
    name: str
    retailer_name: str
    retailer_logo: Optional[str]
    signup_url: Optional[str]
    is_member: bool

    model_config = {"from_attributes": True}


class ActivityItem(BaseModel):
    deal_id: int
    product_name: str
    retailer_name: str
    deal_price: float
    savings_pct: float
    clicked_at: datetime

    model_config = {"from_attributes": True}


# ── מועדונים ────────────────────────────────────────────────────────────────

@router.get("/clubs", response_model=list[ClubInfo])
def get_clubs(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """כל המועדונים עם סטטוס חברות של המשתמש"""
    member_ids = {uc.club_id for uc in current_user.user_clubs}

    clubs = (
        db.query(Club)
        .join(Retailer)
        .order_by(Retailer.name, Club.name)
        .all()
    )

    return [
        ClubInfo(
            id=c.id,
            name=c.name,
            retailer_name=c.retailer.name,
            retailer_logo=c.retailer.logo_url,
            signup_url=c.signup_url,
            is_member=c.id in member_ids,
        )
        for c in clubs
    ]


@router.post("/clubs/{club_id}/join", status_code=204)
def join_club(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="מועדון לא נמצא")

    exists = db.query(UserClub).filter(
        UserClub.user_id == current_user.id,
        UserClub.club_id == club_id,
    ).first()

    if not exists:
        db.add(UserClub(user_id=current_user.id, club_id=club_id))
        db.commit()


@router.delete("/clubs/{club_id}/leave", status_code=204)
def leave_club(
    club_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    membership = db.query(UserClub).filter(
        UserClub.user_id == current_user.id,
        UserClub.club_id == club_id,
    ).first()

    if membership:
        db.delete(membership)
        db.commit()


# ── מעקב קליקים ────────────────────────────────────────────────────────────

@router.post("/click/{deal_id}", status_code=204)
def track_click(
    deal_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        return  # לא שגיאה — פשוט לא מתעדים

    db.add(DealClick(user_id=current_user.id, deal_id=deal_id))
    db.commit()


@router.get("/activity", response_model=list[ActivityItem])
def get_activity(
    limit: int = 20,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """עסקאות שהמשתמש ביקר בהן לאחרונה"""
    clicks = (
        db.query(DealClick)
        .filter(DealClick.user_id == current_user.id)
        .options(
            joinedload(DealClick.deal).joinedload(Deal.product),
            joinedload(DealClick.deal).joinedload(Deal.retailer),
        )
        .order_by(DealClick.clicked_at.desc())
        .limit(limit)
        .all()
    )

    seen = set()
    result = []
    for click in clicks:
        deal = click.deal
        if deal.id in seen:
            continue
        seen.add(deal.id)
        savings_pct = (
            (deal.regular_price - deal.deal_price) / deal.regular_price * 100
            if deal.regular_price > 0 else 0
        )
        result.append(ActivityItem(
            deal_id=deal.id,
            product_name=deal.product.name,
            retailer_name=deal.retailer.name,
            deal_price=deal.deal_price,
            savings_pct=round(savings_pct, 1),
            clicked_at=click.clicked_at,
        ))

    return result
