from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import bcrypt
import os

from database import get_db
from models import User
from schemas import UserRegister, Token

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Funções auxiliares ────────────────────────────────

def hash_password(password: str) -> tuple[str, str]:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return salt.decode(), hashed.decode()

def verify_password(password: str, salt: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    )
    from jose import jwt
    return jwt.encode(
        {"sub": username, "exp": expire},
        os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM", "HS256")
    )

# ── Rotas ─────────────────────────────────────────────

@router.post("/register")
def register(data: UserRegister, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    salt, hashed = hash_password(data.password)
    user = User(username=data.username, salt=salt, hash=hashed)
    db.add(user)
    db.commit()

    token = create_token(data.username)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600,
        samesite="lax"
    )
    return {"message": "Cadastro realizado com sucesso"}


@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.salt, user.hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_token(user.username)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600,
        samesite="lax"
    )
    return {"message": "Login realizado com sucesso"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout realizado com sucesso"}