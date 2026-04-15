from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Skill, User
from schemas import SkillCreate, SkillSchema
from security import get_current_user

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("/", response_model=List[SkillSchema])
def get_skills(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Skill).filter(Skill.user_id == current_user.id).all()


@router.post("/", response_model=SkillSchema)
def create_skill(data: SkillCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    skill = Skill(
        user_id=current_user.id,
        name=data.name
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.patch("/{skill_id}/xp", response_model=SkillSchema)
def add_xp(skill_id: int, xp: float, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill não encontrada")

    skill.xp += xp
    db.commit()
    db.refresh(skill)
    return skill


@router.patch("/{skill_id}/active")
def set_active_skill(skill_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill não encontrada")

    current_user.active_skill_id = str(skill_id)
    db.commit()
    return {"detail": "Skill ativa atualizada"}


@router.delete("/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill não encontrada")

    db.delete(skill)
    db.commit()
    return {"detail": "Skill removida"}