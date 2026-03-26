from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import os

from app.database import get_db
from app.models.models import User, UserRole
from app.auth import hash_password, verify_password, create_access_token, require_user

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleRequest(BaseModel):
    credential: str   # Google ID token from frontend


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Helpers ────────────────────────────────────────────────────────────────

def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "role": user.role,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="כתובת המייל כבר רשומה במערכת")
    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role=UserRole.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(access_token=create_access_token(user.id), user=_user_dict(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="מייל או סיסמה שגויים")
    return AuthResponse(access_token=create_access_token(user.id), user=_user_dict(user))


@router.post("/google", response_model=AuthResponse)
def google_login(body: GoogleRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID לא מוגדר בשרת")
    try:
        info = id_token.verify_oauth2_token(body.credential, grequests.Request(), GOOGLE_CLIENT_ID)
    except ValueError as e:
        print(f"[Google auth error] {e}")
        raise HTTPException(status_code=401, detail=f"טוקן גוגל לא תקין: {e}")

    google_id = info["sub"]
    email = info.get("email", "")
    name = info.get("name", "")
    avatar = info.get("picture", "")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        # check if email already exists (merge accounts)
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            user.avatar_url = avatar
        else:
            user = User(
                email=email,
                name=name,
                avatar_url=avatar,
                google_id=google_id,
                role=UserRole.user,
            )
            db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(access_token=create_access_token(user.id), user=_user_dict(user))


@router.get("/me")
def me(current_user: User = Depends(require_user)):
    return _user_dict(current_user)
