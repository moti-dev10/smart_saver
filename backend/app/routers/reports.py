from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.models import DealReport, ReportType, ReportStatus
from app.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportIn(BaseModel):
    type: ReportType
    notes: str
    deal_id: Optional[int] = None
    suggested_retailer: Optional[str] = None
    suggested_price: Optional[float] = None
    suggested_club: Optional[str] = None


@router.post("", status_code=201)
def submit_report(body: ReportIn, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    report = DealReport(
        user_id=current_user.id if current_user else None,
        deal_id=body.deal_id,
        report_type=body.type,
        notes=body.notes,
        suggested_retailer=body.suggested_retailer,
        suggested_price=body.suggested_price,
        suggested_club=body.suggested_club,
        status=ReportStatus.pending,
    )
    db.add(report)
    db.commit()
    return {"ok": True}
