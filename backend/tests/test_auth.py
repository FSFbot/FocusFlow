import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

# ── Banco de dados exclusivo para testes ──────────────
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)

# ── Testes ────────────────────────────────────────────

def test_register_success():
    response = client.post("/auth/register", json={
        "username": "testuser",
        "password": "senha123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_register_duplicate_user():
    client.post("/auth/register", json={
        "username": "testuser",
        "password": "senha123"
    })
    response = client.post("/auth/register", json={
        "username": "testuser",
        "password": "senha123"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Usuário já existe"


def test_login_success():
    client.post("/auth/register", json={
        "username": "testuser",
        "password": "senha123"
    })
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "senha123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password():
    client.post("/auth/register", json={
        "username": "testuser",
        "password": "senha123"
    })
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "senhaerrada"
    })
    assert response.status_code == 401