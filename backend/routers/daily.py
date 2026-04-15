from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import DailyFocus
from schemas import DailyFocusCreate, DailyFocusSchema
from security import get_current_user

router = APIRouter(prefix="/daily", tags=["daily"])


@router.get("/", response_model=List[DailyFocusSchema])
def get_daily(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(DailyFocus).filter(DailyFocus.user_id == current_user.id).all()


@router.post("/", response_model=DailyFocusSchema)
def save_daily(data: DailyFocusCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    existing = db.query(DailyFocus).filter(
        DailyFocus.user_id == current_user.id,
        DailyFocus.date == data.date
    ).first()

    if existing:
        existing.seconds += data.seconds
        db.commit()
        db.refresh(existing)
        return existing

    log = DailyFocus(
        user_id=current_user.id,
        date=data.date,
        seconds=data.seconds
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log