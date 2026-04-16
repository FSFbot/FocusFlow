import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

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


def login_client(username="testuser", password="senha123"):
    client.post("/auth/register", json={
        "username": username,
        "password": password
    })
    client.post("/auth/login", data={
        "username": username,
        "password": password
    })


# ── Testes ────────────────────────────────────────────

def test_create_task():
    login_client()
    response = client.post("/tasks/", json={"text": "Estudar FastAPI"})
    assert response.status_code == 200
    assert response.json()["text"] == "Estudar FastAPI"
    assert response.json()["done"] == False


def test_get_tasks():
    login_client()
    client.post("/tasks/", json={"text": "Tarefa 1"})
    client.post("/tasks/", json={"text": "Tarefa 2"})
    response = client.get("/tasks/")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_update_task():
    login_client()
    task = client.post("/tasks/", json={"text": "Tarefa teste"}).json()
    response = client.patch(f"/tasks/{task['id']}", json={
        "done": True,
        "done_at": "2026-04-15"
    })
    assert response.status_code == 200
    assert response.json()["done"] == True


def test_delete_task():
    login_client()
    task = client.post("/tasks/", json={"text": "Deletar isso"}).json()
    client.delete(f"/tasks/{task['id']}")
    response = client.get("/tasks/")
    assert len(response.json()) == 0


def test_cannot_access_other_user_task():
    login_client(username="user1")
    task = client.post("/tasks/", json={"text": "Tarefa do user1"}).json()

    login_client(username="user2")
    response = client.delete(f"/tasks/{task['id']}")
    assert response.status_code == 404