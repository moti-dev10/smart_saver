import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import search
from app.routers import auth as auth_router
from app.routers import admin as admin_router
from app.routers import reports as reports_router
from app.routers import profile as profile_router
from app.routers import wishlist as wishlist_router
from app.routers import import_data as import_router
from app.database import engine
from app.models import models as _models  # noqa — מוודא שכל המודלים רשומים

# יצירת כל הטבלאות החסרות בהפעלת השרת (לא מוחק נתונים קיימים)
_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="חסכון חכם API",
    description="אגרגטור השוואת מחירים עם הטבות מועדוני לקוחות",
    version="0.1.0",
)

_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = ["http://localhost:3000", "http://localhost:5173"]
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, tags=["search"])
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(reports_router.router)
app.include_router(profile_router.router)
app.include_router(wishlist_router.router)
app.include_router(import_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
