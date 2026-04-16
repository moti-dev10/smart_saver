import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv

# טעינת קובץ .env רק אם הוא קיים (לפיתוח מקומי)
load_dotenv()

# משיכת הכתובת מרנדר
DATABASE_URL = os.getenv("DATABASE_URL")

# תיקון אוטומטי לקידומת: SQLAlchemy מחייבת postgresql:// ולא postgres://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# אם אין כתובת (למשל בהרצה מקומית), נשתמש בברירת מחדל
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/hachaskon_chacham"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
