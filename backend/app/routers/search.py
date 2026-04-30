from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, distinct
from datetime import date
from typing import Optional

from app.database import get_db
from app.models.models import Product, Deal, User, UserClub
from app.schemas.schemas import SearchResult, ProductResult, DealResult

router = APIRouter()

# מילון תרגום — עברית לאנגלית לצורך חיפוש
SEARCH_SYNONYMS: dict[str, str] = {
    "אייפון": "iPhone",
    "אפל": "Apple",
    "סמסונג": "Samsung",
    "סוני": "Sony",
    "פלייסטיישן": "PlayStation",
    "פלייסטיישין": "PlayStation",
    "פס5": "PS5",
    "נינטנדו": "Nintendo",
    "מיקרוסופט": "Microsoft",
    "אירפודס": "AirPods",
    "אייפד": "iPad",
    "מקבוק": "MacBook",
    "דרימי": "Dreame",
    "טינקו": "Tineco",
    "דייסון": "Dyson",
    "בוש": "Bosch",
    "סימנס": "Siemens",
    "מיצובישי": "Mitsubishi",
    "מיטסובישי": "Mitsubishi",
    "פיליפס": "Philips",
    "פנסוניק": "Panasonic",
    "לג": "LG",
    "נינג'ה": "Ninja",
    "ניל'ג": "Ninja",
}

def translate_query(q: str) -> str:
    """מתרגם מונחי חיפוש עבריים למקבילות האנגליות."""
    result = q
    for heb, eng in SEARCH_SYNONYMS.items():
        result = result.replace(heb, eng)
    return result


@router.get("/search/suggestions")
def search_suggestions(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    q_translated = translate_query(q)
    products = (
        db.query(Product.name)
        .filter(or_(
            Product.name.ilike(f"%{q}%"),
            Product.name.ilike(f"%{q_translated}%"),
        ))
        .limit(6)
        .all()
    )
    return {"suggestions": [p.name for p in products]}


@router.get("/search/categories")
def get_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(distinct(Product.category))
        .filter(Product.category != None)
        .all()
    )
    return {"categories": sorted([r[0] for r in rows])}


def _build_deal_results(product, active_deals, user_club_ids):
    deal_results = []
    for deal in active_deals:
        is_club_deal = deal.club_id is not None
        user_has_club = deal.club_id in user_club_ids if is_club_deal else True
        effective_price = deal.deal_price if (not is_club_deal or user_has_club) else deal.regular_price
        savings = deal.regular_price - effective_price
        savings_pct = (savings / deal.regular_price * 100) if deal.regular_price > 0 else 0
        deal_results.append(DealResult(
            id=deal.id,
            retailer_name=deal.retailer.name,
            retailer_logo=deal.retailer.logo_url,
            affiliate_url=deal.retailer.affiliate_url,
            club_name=deal.club.name if deal.club else None,
            regular_price=deal.regular_price,
            deal_price=effective_price,
            savings=round(savings, 2),
            savings_pct=round(savings_pct, 1),
            is_club_deal=is_club_deal,
            user_has_club=user_has_club,
            valid_until=deal.valid_until,
        ))
    deal_results.sort(key=lambda d: d.deal_price)
    return deal_results


@router.get("/search/featured", response_model=SearchResult)
def get_featured(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    today = date.today()
    user_club_ids: set[int] = set()
    if user_id:
        memberships = db.query(UserClub).filter(UserClub.user_id == user_id).all()
        user_club_ids = {m.club_id for m in memberships}

    products = db.query(Product).all()
    results = []

    for product in products:
        active_deals = (
            db.query(Deal)
            .filter(
                Deal.product_id == product.id,
                or_(Deal.valid_until == None, Deal.valid_until >= today),
                or_(Deal.valid_from == None, Deal.valid_from <= today),
            )
            .all()
        )
        if not active_deals:
            continue
        deal_results = _build_deal_results(product, active_deals, user_club_ids)
        best = deal_results[0]
        results.append(ProductResult(
            id=product.id,
            name=product.name,
            category=product.category,
            image_url=product.image_url,
            best_price=best.deal_price,
            best_deal=best,
            all_deals=deal_results,
        ))

    results.sort(key=lambda p: p.best_deal.savings_pct, reverse=True)
    featured = results[:8]
    return SearchResult(query="מבצעים מובילים", results=featured, total=len(featured))


@router.get("/search", response_model=SearchResult)
def search_products(
    q: Optional[str] = Query(None, description="מונח חיפוש"),
    category: Optional[str] = Query(None, description="סינון לפי קטגוריה"),
    categories: Optional[str] = Query(None, description="קטגוריות מרובות מופרדות בפסיק"),
    min_price: Optional[float] = Query(None, description="מחיר מינימום"),
    max_price: Optional[float] = Query(None, description="מחיר מקסימום"),
    sort_by: Optional[str] = Query("price_asc", description="מיון: price_asc / price_desc / savings_pct"),
    user_id: Optional[int] = Query(None, description="מזהה משתמש לחישוב הטבות מועדון"),
    db: Session = Depends(get_db),
):
    today = date.today()

    if not q and not category and not categories:
        return SearchResult(query="", results=[], total=0)

    # אחזור מועדוני המשתמש
    user_club_ids: set[int] = set()
    if user_id:
        memberships = db.query(UserClub).filter(UserClub.user_id == user_id).all()
        user_club_ids = {m.club_id for m in memberships}

    # בניית שאילתת מוצרים
    query_obj = db.query(Product)

    if q:
        q_translated = translate_query(q)
        query_obj = query_obj.filter(or_(
            Product.name.ilike(f"%{q}%"),
            Product.name.ilike(f"%{q_translated}%"),
        ))

    if categories:
        cat_list = [c.strip() for c in categories.split(',')]
        query_obj = query_obj.filter(Product.category.in_(cat_list))
    elif category:
        query_obj = query_obj.filter(Product.category == category)

    products = query_obj.all()

    results: list[ProductResult] = []

    for product in products:
        active_deals = (
            db.query(Deal)
            .filter(
                Deal.product_id == product.id,
                or_(Deal.valid_until == None, Deal.valid_until >= today),
                or_(Deal.valid_from == None, Deal.valid_from <= today),
            )
            .all()
        )

        if not active_deals:
            continue

        deal_results = _build_deal_results(product, active_deals, user_club_ids)
        best = deal_results[0]
        best_price = best.deal_price

        # סינון לפי טווח מחיר
        if min_price is not None and best_price < min_price:
            continue
        if max_price is not None and best_price > max_price:
            continue

        results.append(ProductResult(
            id=product.id,
            name=product.name,
            category=product.category,
            image_url=product.image_url,
            best_price=best_price,
            best_deal=best,
            all_deals=deal_results,
        ))

    # מיון
    if sort_by == "price_desc":
        results.sort(key=lambda p: p.best_price, reverse=True)
    elif sort_by == "savings_pct":
        results.sort(key=lambda p: p.best_deal.savings_pct, reverse=True)
    else:  # price_asc (ברירת מחדל)
        results.sort(key=lambda p: p.best_price)

    return SearchResult(query=q or category or categories or "", results=results, total=len(results))
