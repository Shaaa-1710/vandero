from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from api.routers import auth, wards, complaints, admin
from seed_data import seed_db

try:
    seed_db()
except Exception as e:
    print(f"Database startup notice: {e}")

app = FastAPI(title="Civic Pulse API (PostgreSQL)")

origins = [
    "https://vandero.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(auth.router)
app.include_router(wards.router)
app.include_router(complaints.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Civic Pulse API (Neon PostgreSQL Connected)"}
