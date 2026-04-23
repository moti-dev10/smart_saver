"""
סקריפט חד-פעמי: מוסיף רשתות ומועדונים אם לא קיימים,
ומגדיר משתמש כאדמין לפי אימייל.

הרצה:
    cd backend
    python -m app.setup_clubs
"""
import os
from app.database import SessionLocal, engine
from app.models.models import Base, Retailer, Club, User, UserRole

ADMIN_EMAIL = "ShiraV@malamteam.com"

RETAILERS = [
    {"name": "KSP",               "logo_url": "https://www.ksp.co.il/favicon.ico",      "affiliate_url": "https://www.ksp.co.il"},
    {"name": "BUG",               "logo_url": "https://www.bug.co.il/favicon.ico",      "affiliate_url": "https://www.bug.co.il"},
    {"name": "אייבורי",           "logo_url": "https://www.ivory.co.il/favicon.ico",    "affiliate_url": "https://www.ivory.co.il"},
    {"name": "המשביר לצרכן",      "logo_url": "https://www.hamashbir.com/favicon.ico",  "affiliate_url": "https://www.hamashbir.com"},
    {"name": "המחסן האלקטרוני",   "logo_url": "https://www.hmahsan.co.il/favicon.ico",  "affiliate_url": "https://www.hmahsan.co.il"},
]

CLUBS = {
    "KSP":             [{"name": "מועדון KSP",            "signup_url": "https://www.ksp.co.il/club"}],
    "BUG":             [{"name": "BUG Club",               "signup_url": "https://www.bug.co.il/club"}],
    "אייבורי":         [{"name": "מועדון אייבורי",         "signup_url": "https://www.ivory.co.il/club"}],
    "המשביר לצרכן":   [{"name": "מועדון המשביר",          "signup_url": "https://www.hamashbir.com/club"}],
    "המחסן האלקטרוני":[{"name": "מועדון המחסן האלקטרוני", "signup_url": "https://www.hmahsan.co.il/club"}],
}


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ── רשתות ──────────────────────────────────────────────────────────────
    retailer_map = {}
    for r in RETAILERS:
        existing = db.query(Retailer).filter_by(name=r["name"]).first()
        if not existing:
            existing = Retailer(**r)
            db.add(existing)
            db.flush()
            print(f"  + רשת: {r['name']}")
        else:
            print(f"  = רשת קיימת: {r['name']}")
        retailer_map[r["name"]] = existing

    # ── מועדונים ───────────────────────────────────────────────────────────
    for retailer_name, clubs in CLUBS.items():
        retailer = retailer_map[retailer_name]
        for c in clubs:
            existing = db.query(Club).filter_by(name=c["name"], retailer_id=retailer.id).first()
            if not existing:
                db.add(Club(retailer_id=retailer.id, **c))
                print(f"  + מועדון: {c['name']}")
            else:
                print(f"  = מועדון קיים: {c['name']}")

    # ── אדמין ──────────────────────────────────────────────────────────────
    user = db.query(User).filter_by(email=ADMIN_EMAIL).first()
    if user:
        if user.role != UserRole.admin:
            user.role = UserRole.admin
            print(f"  ✓ {ADMIN_EMAIL} עודכן לאדמין")
        else:
            print(f"  = {ADMIN_EMAIL} כבר אדמין")
    else:
        print(f"  ⚠ משתמש {ADMIN_EMAIL} לא נמצא — התחברי קודם ואז הרץ שוב")

    db.commit()
    db.close()
    print("✅ הסיום!")


if __name__ == "__main__":
    run()
