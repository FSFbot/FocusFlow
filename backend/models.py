from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    salt     = Column(String, nullable=False)
    hash     = Column(String, nullable=False)
    active_skill_id = Column(String, nullable=True)

    config     = relationship("Config", back_populates="user", uselist=False)
    tasks      = relationship("Task", back_populates="user")
    skills     = relationship("Skill", back_populates="user")
    daily_logs = relationship("DailyFocus", back_populates="user")


class Config(Base):
    __tablename__ = "configs"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    focus_min  = Column(Integer, default=25)
    break_min  = Column(Integer, default=5)

    user = relationship("User", back_populates="config")


class Task(Base):
    __tablename__ = "tasks"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    text     = Column(String, nullable=False)
    skill_id = Column(String, nullable=True)
    done     = Column(Boolean, default=False)
    done_at  = Column(String, nullable=True)

    user = relationship("User", back_populates="tasks")


class Skill(Base):
    __tablename__ = "skills"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name    = Column(String, nullable=False)
    xp      = Column(Float, default=0)

    user = relationship("User", back_populates="skills")


class DailyFocus(Base):
    __tablename__ = "daily_focus"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date    = Column(String, nullable=False)
    seconds = Column(Integer, default=0)

    user = relationship("User", back_populates="daily_logs")