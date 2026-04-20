from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine, Base
from routers import auth, tasks, skills, config, daily

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusFlow API")

origins = os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1:5500").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(skills.router)
app.include_router(config.router)
app.include_router(daily.router)


@app.get("/")
def root():
    return {"status": "FocusFlow API rodando"}