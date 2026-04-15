from pydantic import BaseModel, ConfigDict
from typing import Optional

# ── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ── Config ────────────────────────────────────────────
class ConfigSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    focus_min: int
    break_min: int

# ── Tasks ─────────────────────────────────────────────
class TaskCreate(BaseModel):
    text: str
    skill_id: Optional[str] = None

class TaskUpdate(BaseModel):
    done: Optional[bool] = None
    done_at: Optional[str] = None
    skill_id: Optional[str] = None

class TaskSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    skill_id: Optional[str] = None
    done: bool
    done_at: Optional[str] = None

# ── Skills ────────────────────────────────────────────
class SkillCreate(BaseModel):
    name: str

class SkillSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    xp: float

# ── Daily Focus ───────────────────────────────────────
class DailyFocusCreate(BaseModel):
    date: str
    seconds: int

class DailyFocusSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: str
    seconds: int