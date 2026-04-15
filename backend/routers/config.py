from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Config
from schemas import ConfigSchema
from security import get_current_user

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/", response_model=ConfigSchema)
def get_config(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    config = db.query(Config).filter(Config.user_id == current_user.id).first()
    if not config:
        config = Config(user_id=current_user.id, focus_min=25, break_min=5)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/", response_model=ConfigSchema)
def update_config(data: ConfigSchema, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    config = db.query(Config).filter(Config.user_id == current_user.id).first()
    if not config:
        config = Config(user_id=current_user.id)
        db.add(config)

    config.focus_min = data.focus_min
    config.break_min = data.break_min
    db.commit()
    db.refresh(config)
    return config