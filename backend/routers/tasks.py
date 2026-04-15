from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Task
from schemas import TaskCreate, TaskUpdate, TaskSchema
from security import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskSchema])
def get_tasks(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Task).filter(Task.user_id == current_user.id).all()


@router.post("/", response_model=TaskSchema)
def create_task(data: TaskCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = Task(
        user_id=current_user.id,
        text=data.text,
        skill_id=data.skill_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskSchema)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    if data.done is not None:
        task.done = data.done
    if data.done_at is not None:
        task.done_at = data.done_at
    if data.skill_id is not None:
        task.skill_id = data.skill_id

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    db.delete(task)
    db.commit()
    return {"detail": "Tarefa removida"}