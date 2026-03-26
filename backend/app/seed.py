"""Seed the database with sample data."""
from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.models.models import Base, Retailer, Club, Product, Deal, User, UserClub, UserRole
from app.auth import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(UserClub).delete()
    db.query(Deal).delete()
    db.query(User).delete()
    db.query(Club).delete()
    db.query(Product).delete()
    db.query(Retailer).delete()
    db.commit()

    # ── Retailers ──────────────────────────────────────────────────────────
    retailers_data = [
        {"name": "KSP", "logo_url": "https://www.ksp.co.il/favicon.ico", "affiliate_url": "https://www.ksp.co.il"},
        {"name": "BUG", "logo_url": "https://www.bug.co.il/favicon.ico", "affiliate_url": "https://www.bug.co.il"},
        {"name": "אייבורי", "logo_url": "https://www.ivory.co.il/favicon.ico", "affiliate_url": "https://www.ivory.co.il"},
        {"name": "המשביר לצרכן", "logo_url": "https://www.hamashbir.com/favicon.ico", "affiliate_url": "https://www.hamashbir.com"},
        {"name": "המחסן האלקטרוני", "logo_url": "https://www.hmahsan.co.il/favicon.ico", "affiliate_url": "https://www.hmahsan.co.il"},
    ]
    retailers = [Retailer(**r) for r in retailers_data]
    db.add_all(retailers)
    db.flush()

    ksp, bug, ivory, mashbir, mahsan = retailers

    # ── Clubs ──────────────────────────────────────────────────────────────
    clubs_data = [
        {"retailer": ksp,    "name": "מועדון KSP",           "signup_url": "https://www.ksp.co.il/club"},
        {"retailer": bug,    "name": "BUG Club",              "signup_url": "https://www.bug.co.il/club"},
        {"retailer": ivory,  "name": "מועדון אייבורי",        "signup_url": "https://www.ivory.co.il/club"},
        {"retailer": mashbir,"name": "מועדון המשביר",         "signup_url": "https://www.hamashbir.com/club"},
        {"retailer": mahsan, "name": "מועדון המחסן האלקטרוני","signup_url": "https://www.hmahsan.co.il/club"},
    ]
    clubs = []
    for c in clubs_data:
        club = Club(retailer_id=c["retailer"].id, name=c["name"], signup_url=c["signup_url"])
        clubs.append(club)
    db.add_all(clubs)
    db.flush()

    ksp_club, bug_club, ivory_club, mashbir_club, mahsan_club = clubs

    # ── Products ───────────────────────────────────────────────────────────
    products_data = [
        {"name": "מקרר סמסונג 500 ליטר No Frost",         "category": "מקררים",       "barcode": "8806094878844", "image_url": "https://cdn.ksp.co.il/items/samsung_fridge.jpg"},
        {"name": "מקרר LG 450 ליטר דלת-בדלת",             "category": "מקררים",       "barcode": "8806091155979", "image_url": "https://cdn.ksp.co.il/items/lg_fridge.jpg"},
        {"name": 'טלוויזיה סמסונג QLED 65"',               "category": "טלוויזיות",    "barcode": "8806094043907", "image_url": "https://cdn.ksp.co.il/items/samsung_tv65.jpg"},
        {"name": 'טלוויזיה LG OLED 55"',                   "category": "טלוויזיות",    "barcode": "8806091770659", "image_url": "https://cdn.ksp.co.il/items/lg_oled55.jpg"},
        {"name": "מכונת כביסה בוש 9 ק\"ג",                 "category": "מכונות כביסה", "barcode": "4242002976136", "image_url": "https://cdn.ksp.co.il/items/bosch_wash.jpg"},
        {"name": "מייבש כביסה אלקטרולוקס 8 ק\"ג",          "category": "מייבשים",      "barcode": "7332543673742", "image_url": "https://cdn.ksp.co.il/items/electrolux_dry.jpg"},
        {"name": "מדיח כלים בוש 60 ס\"מ",                  "category": "מדיחים",       "barcode": "4242002827650", "image_url": "https://cdn.ksp.co.il/items/bosch_dish.jpg"},
        {"name": "מזגן עמינח 1.5 כ\"ס אינוורטר",           "category": "מזגנים",       "barcode": "7290014660016", "image_url": "https://cdn.ksp.co.il/items/aminach_ac.jpg"},
        {"name": "אייפון 15 פרו 256GB",                    "category": "סמארטפונים",   "barcode": "0194253718802", "image_url": "https://cdn.ksp.co.il/items/iphone15pro.jpg"},
        {"name": "לפטופ Dell XPS 15 Core i7",              "category": "מחשבים ניידים","barcode": "5397184807667", "image_url": "https://cdn.ksp.co.il/items/dell_xps15.jpg"},
    ]
    products = [Product(**p) for p in products_data]
    db.add_all(products)
    db.flush()

    fridge_samsung, fridge_lg, tv_samsung, tv_lg, washer, dryer, dishwasher, ac, iphone, laptop = products

    today = date.today()
    future = today + timedelta(days=30)

    # ── Deals ──────────────────────────────────────────────────────────────
    # Format: (product, retailer, club_or_None, regular_price, deal_price)
    deals_data = [
        # מקרר סמסונג
        (fridge_samsung, ksp,    ksp_club,    4990, 4290),
        (fridge_samsung, bug,    bug_club,    4990, 4490),
        (fridge_samsung, ivory,  None,        4990, 4750),
        (fridge_samsung, mashbir,mashbir_club,4990, 4350),
        (fridge_samsung, mahsan, None,        4990, 4800),

        # מקרר LG
        (fridge_lg, ksp,    ksp_club,    4200, 3690),
        (fridge_lg, bug,    None,        4200, 3950),
        (fridge_lg, ivory,  ivory_club,  4200, 3750),
        (fridge_lg, mahsan, None,        4200, 4050),

        # טלוויזיה סמסונג
        (tv_samsung, ksp,    ksp_club,    7990, 6990),
        (tv_samsung, bug,    bug_club,    7990, 7290),
        (tv_samsung, ivory,  ivory_club,  7990, 7100),
        (tv_samsung, mashbir,None,        7990, 7500),

        # טלוויזיה LG
        (tv_lg, ksp,    None,        9990, 8990),
        (tv_lg, bug,    bug_club,    9990, 8590),
        (tv_lg, ivory,  ivory_club,  9990, 8750),

        # מכונת כביסה
        (washer, ksp,    ksp_club,    3200, 2790),
        (washer, bug,    None,        3200, 2990),
        (washer, mahsan, mahsan_club, 3200, 2850),

        # מייבש
        (dryer, ivory,  ivory_club,  2800, 2390),
        (dryer, mashbir,None,        2800, 2650),

        # מדיח
        (dishwasher, ksp,    ksp_club,    2500, 2100),
        (dishwasher, bug,    bug_club,    2500, 2250),
        (dishwasher, mahsan, None,        2500, 2350),

        # מזגן
        (ac, ivory,  ivory_club,  4500, 3890),
        (ac, mahsan, mahsan_club, 4500, 3990),
        (ac, mashbir,None,        4500, 4200),

        # אייפון
        (iphone, ksp,    ksp_club,    5990, 5690),
        (iphone, bug,    bug_club,    5990, 5590),
        (iphone, ivory,  ivory_club,  5990, 5750),
        (iphone, mahsan, None,        5990, 5850),

        # לפטופ
        (laptop, ksp,    ksp_club,    8500, 7490),
        (laptop, bug,    bug_club,    8500, 7690),
        (laptop, ivory,  None,        8500, 7900),
    ]

    deals = []
    for prod, retailer, club, regular, deal in deals_data:
        d = Deal(
            product_id=prod.id,
            retailer_id=retailer.id,
            club_id=club.id if club else None,
            regular_price=regular,
            deal_price=deal,
            valid_from=today,
            valid_until=future,
        )
        deals.append(d)
    db.add_all(deals)
    db.flush()

    # ── Users ──────────────────────────────────────────────────────────────
    user1 = User(email="demo@hachaskon.co.il", name="מנהל", password_hash=hash_password("demo1234"), role=UserRole.admin)
    user2 = User(email="guest@hachaskon.co.il", name="אורח", password_hash=hash_password("guest1234"))
    db.add_all([user1, user2])
    db.flush()

    # User 1 has KSP + BUG clubs
    db.add_all([
        UserClub(user_id=user1.id, club_id=ksp_club.id),
        UserClub(user_id=user1.id, club_id=bug_club.id),
    ])

    # User 2 has Ivory + Mashbir clubs
    db.add_all([
        UserClub(user_id=user2.id, club_id=ivory_club.id),
        UserClub(user_id=user2.id, club_id=mashbir_club.id),
    ])

    db.commit()
    print("✅ Seed complete!")
    print(f"   {len(retailers)} retailers | {len(clubs)} clubs | {len(products)} products | {len(deals)} deals | 2 users")
    db.close()


if __name__ == "__main__":
    seed()
