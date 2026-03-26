from pydantic import BaseModel
from typing import Optional
from datetime import date


class DealResult(BaseModel):
    id: Optional[int]
    retailer_name: str
    retailer_logo: Optional[str]
    affiliate_url: Optional[str]
    club_name: Optional[str]
    regular_price: float
    deal_price: float
    savings: float
    savings_pct: float
    is_club_deal: bool
    user_has_club: bool
    valid_until: Optional[date]

    model_config = {"from_attributes": True}


class ProductResult(BaseModel):
    id: int
    name: str
    category: Optional[str]
    image_url: Optional[str]
    best_price: float
    best_deal: DealResult
    all_deals: list[DealResult]

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    query: str
    results: list[ProductResult]
    total: int
