from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import date, datetime
import csv
import json
import io

from app.database import get_db
from app.models.models import Product, Deal, Retailer, Club
from app.auth import require_editor

router = APIRouter(prefix="/admin/import", tags=["admin"])

# ── מיפוי שמות עמודות (עברית + אנגלית) לשדות פנימיים ──────────────────────

COLUMN_MAP: Dict[str, str] = {
    # מזהים
    "deal_id": "deal_id", "מזהה עסקה": "deal_id", "id עסקה": "deal_id",
    "product_id": "product_id", "מזהה מוצר": "product_id", "id מוצר": "product_id",
    "retailer_id": "retailer_id", "club_id": "club_id",
    # מוצר
    "שם מוצר": "product_name", "מוצר": "product_name", "שם": "product_name",
    "product": "product_name", "product_name": "product_name", "name": "product_name",
    "item": "product_name", "title": "product_name", "כותרת": "product_name",
    "דגם": "product_name", "model": "product_name",
    # קטגוריה
    "קטגוריה": "category", "סוג": "category", "סוג מוצר": "category",
    "category": "category", "cat": "category", "type": "category",
    # ברקוד
    "ברקוד": "barcode", "barcode": "barcode", "ean": "barcode", "upc": "barcode", "קוד": "barcode",
    # תמונה
    "תמונה": "image_url", "קישור תמונה": "image_url", "לוגו": "image_url",
    "image_url": "image_url", "image": "image_url", "img": "image_url", "photo": "image_url", "picture": "image_url",
    # קישור לאתר (affiliate)
    "קישור לאתר": "affiliate_url", "קישור": "affiliate_url", "אתר": "affiliate_url",
    "affiliate_url": "affiliate_url", "link": "affiliate_url", "url": "affiliate_url", "product_url": "affiliate_url",
    # רשת / חנות
    "רשת": "retailer_name", "חנות": "retailer_name", "ספק": "retailer_name",
    "שם חנות": "retailer_name", "שם רשת": "retailer_name", "מוכר": "retailer_name",
    "retailer": "retailer_name", "retailer_name": "retailer_name",
    "store": "retailer_name", "shop": "retailer_name", "vendor": "retailer_name", "seller": "retailer_name",
    # מועדון
    "מועדון": "club_name", "שם מועדון": "club_name", "מועדון קניות": "club_name",
    "הטבת מועדון": "club_name", "כרטיס": "club_name",
    "club": "club_name", "club_name": "club_name", "membership": "club_name",
    # מחיר רגיל
    "מחיר רגיל": "regular_price", "מחיר מקורי": "regular_price", "מחיר": "regular_price",
    "מחיר מלא": "regular_price", "מחיר לפני הנחה": "regular_price", "מחיר קטלוגי": "regular_price",
    "regular_price": "regular_price", "price": "regular_price", "original_price": "regular_price",
    "full_price": "regular_price", "list_price": "regular_price", "msrp": "regular_price",
    # מחיר מבצע / מועדון
    "מחיר מבצע": "deal_price", "מחיר עם מועדון": "deal_price", "מחיר הטבה": "deal_price",
    "מבצע": "deal_price", "מחיר חבר": "deal_price", "מחיר מיוחד": "deal_price",
    "הנחה": "deal_price", "מחיר אחרי הנחה": "deal_price",
    "deal_price": "deal_price", "sale_price": "deal_price", "discount_price": "deal_price",
    "offer_price": "deal_price", "promo_price": "deal_price", "final_price": "deal_price",
    # תאריך התחלה
    "תוקף מ": "valid_from", "מתאריך": "valid_from", "תחילת מבצע": "valid_from", "מתי מתחיל": "valid_from",
    "valid_from": "valid_from", "start_date": "valid_from", "from_date": "valid_from", "date_from": "valid_from",
    # תאריך סיום
    "תוקף עד": "valid_until", "תוקף עד (yyyy-mm-dd)": "valid_until",
    "עד תאריך": "valid_until", "תוקף": "valid_until", "סיום מבצע": "valid_until", "עד מתי": "valid_until",
    "valid_until": "valid_until", "end_date": "valid_until", "expiry": "valid_until",
    "expiry_date": "valid_until", "date_until": "valid_until", "to_date": "valid_until",
    # הערות (עמודת תיעוד — לא נשמרת במסד)
    "הערות": "notes", "הערה": "notes", "תיאור": "notes", "notes": "notes", "comment": "notes", "remarks": "notes",
}


def _lookup(col) -> Optional[str]:
    if col is None:
        return None
    col = str(col).strip()
    return COLUMN_MAP.get(col) or COLUMN_MAP.get(col.lower())


def map_row(raw: Dict[str, Any]) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for col, val in raw.items():
        field = _lookup(col)
        if field and val not in ("", None):
            result[field] = val
    return result


def get_column_mapping(headers: List[str]) -> Dict[str, Optional[str]]:
    return {col: _lookup(col) for col in headers}


def parse_date(val: Any) -> Optional[date]:
    if val is None or str(val).strip() in ("", "None", "nan"):
        return None
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def parse_float(val: Any) -> Optional[float]:
    if val is None or str(val).strip() in ("", "None", "nan"):
        return None
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def parse_file(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "csv":
        text = file_bytes.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        return [dict(row) for row in reader]

    elif ext in ("xlsx", "xls"):
        try:
            import openpyxl
        except ImportError:
            raise HTTPException(400, "openpyxl לא מותקן — הרץ: pip install openpyxl")
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        ws = wb.active
        all_rows = list(ws.iter_rows(values_only=True))
        if not all_rows:
            return []
        headers = [
            str(h).strip() if h is not None else f"עמודה_{i + 1}"
            for i, h in enumerate(all_rows[0])
        ]
        result = []
        for row in all_rows[1:]:
            if all(v is None for v in row):
                continue
            result.append(
                {headers[i]: ("" if v is None else str(v).strip()) for i, v in enumerate(row)}
            )
        return result

    elif ext == "json":
        data = json.loads(file_bytes.decode("utf-8"))
        if isinstance(data, list):
            return data
        for v in data.values():
            if isinstance(v, list):
                return v
        return [data]

    else:
        raise HTTPException(
            400, f"סוג קובץ לא נתמך: .{ext or 'לא ידוע'} — השתמש ב-CSV, XLSX, או JSON"
        )


# ── Endpoints ──────────────────────────────────────────────────────────────

def row_has_content(row: Dict[str, Any]) -> bool:
    mapped = map_row(row)
    return bool(
        (mapped.get("product_name") or mapped.get("product_id")) and
        (mapped.get("retailer_name") or mapped.get("retailer_id")) and
        (mapped.get("regular_price") or mapped.get("deal_price"))
    )


@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    _=Depends(require_editor),
):
    file_bytes = await file.read()
    rows = parse_file(file_bytes, file.filename or "")

    if not rows:
        raise HTTPException(400, "הקובץ ריק")

    headers = [h for h in rows[0].keys() if h is not None]
    col_mapping = get_column_mapping(headers)

    rows_with_meta = [
        {"index": i, "has_content": row_has_content(row), "data": row}
        for i, row in enumerate(rows)
    ]

    return {
        "total_rows": len(rows),
        "rows": rows_with_meta,
        "headers": headers,
        "column_mapping": col_mapping,
    }


@router.post("/save")
async def save_import(
    file: UploadFile = File(...),
    selected_indices: str = "",
    db: Session = Depends(get_db),
    _=Depends(require_editor),
):
    file_bytes = await file.read()
    rows = parse_file(file_bytes, file.filename or "")

    if not rows:
        raise HTTPException(400, "הקובץ ריק")

    # סנן לפי האינדקסים הנבחרים
    if selected_indices:
        idx_set = {int(x) for x in selected_indices.split(",") if x.strip().isdigit()}
        rows = [r for i, r in enumerate(rows) if i in idx_set]

    if not rows:
        raise HTTPException(400, "לא נבחרו שורות לייבוא")

    imported = 0
    updated = 0
    skipped = 0
    errors: List[str] = []

    for i, raw_row in enumerate(rows, start=2):  # שורה 1 = כותרות
        row = map_row(raw_row)

        # ── ולידציה ─────────────────────────────────────────────────
        if not (row.get("product_name") or row.get("product_id")):
            errors.append(f"שורה {i}: חסר שם מוצר")
            skipped += 1
            continue
        if not (row.get("retailer_name") or row.get("retailer_id")):
            errors.append(f"שורה {i}: חסרת רשת")
            skipped += 1
            continue
        if not row.get("regular_price"):
            errors.append(f"שורה {i}: חסר מחיר רגיל")
            skipped += 1
            continue
        if not row.get("deal_price"):
            errors.append(f"שורה {i}: חסר מחיר מבצע/מועדון")
            skipped += 1
            continue

        regular_price = parse_float(row["regular_price"])
        deal_price = parse_float(row["deal_price"])
        if regular_price is None or deal_price is None:
            errors.append(f"שורה {i}: מחיר לא תקין")
            skipped += 1
            continue

        # ── שמירה עם savepoint לכל שורה ────────────────────────────
        sp = db.begin_nested()
        try:
            # Retailer
            if row.get("retailer_id"):
                retailer = db.query(Retailer).filter(Retailer.id == int(row["retailer_id"])).first()
            else:
                rname = str(row["retailer_name"]).strip()
                retailer = db.query(Retailer).filter(
                    func.lower(Retailer.name) == rname.lower()
                ).first()
                if not retailer:
                    retailer = Retailer(name=rname, affiliate_url=row.get("affiliate_url"))
                    db.add(retailer)
                    db.flush()
                elif row.get("affiliate_url") and not retailer.affiliate_url:
                    retailer.affiliate_url = row["affiliate_url"]

            if not retailer:
                errors.append(f"שורה {i}: רשת לא נמצאה")
                skipped += 1
                sp.rollback()
                continue

            # Club
            club = None
            if row.get("club_id"):
                club = db.query(Club).filter(Club.id == int(row["club_id"])).first()
            elif row.get("club_name"):
                cname = str(row["club_name"]).strip()
                club = db.query(Club).filter(
                    func.lower(Club.name) == cname.lower(),
                    Club.retailer_id == retailer.id,
                ).first()
                if not club:
                    club = Club(name=cname, retailer_id=retailer.id)
                    db.add(club)
                    db.flush()

            # Product — ID → ברקוד → שם
            product = None
            if row.get("product_id"):
                product = db.query(Product).filter(Product.id == int(row["product_id"])).first()
            if not product and row.get("barcode"):
                product = db.query(Product).filter(Product.barcode == str(row["barcode"])).first()
            if not product and row.get("product_name"):
                pname = str(row["product_name"]).strip()
                product = db.query(Product).filter(
                    func.lower(Product.name) == pname.lower()
                ).first()

            if product:
                if row.get("category"):
                    product.category = row["category"]
                if row.get("barcode"):
                    product.barcode = row["barcode"]
                if row.get("image_url"):
                    product.image_url = row["image_url"]
            else:
                product = Product(
                    name=str(row.get("product_name", "")).strip(),
                    category=row.get("category"),
                    barcode=row.get("barcode"),
                    image_url=row.get("image_url"),
                )
                db.add(product)
                db.flush()

            # Deal — ID → (product, retailer, club)
            club_id = club.id if club else None
            deal = None
            if row.get("deal_id"):
                deal = db.query(Deal).filter(Deal.id == int(row["deal_id"])).first()
            if not deal:
                deal = db.query(Deal).filter(
                    Deal.product_id == product.id,
                    Deal.retailer_id == retailer.id,
                    Deal.club_id == club_id,
                ).first()

            if deal:
                deal.regular_price = regular_price
                deal.deal_price = deal_price
                deal.valid_from = parse_date(row.get("valid_from"))
                deal.valid_until = parse_date(row.get("valid_until"))
                updated += 1
            else:
                db.add(Deal(
                    product_id=product.id,
                    retailer_id=retailer.id,
                    club_id=club_id,
                    regular_price=regular_price,
                    deal_price=deal_price,
                    valid_from=parse_date(row.get("valid_from")),
                    valid_until=parse_date(row.get("valid_until")),
                ))
                imported += 1

            sp.commit()

        except Exception as e:
            sp.rollback()
            errors.append(f"שורה {i}: שגיאה — {str(e)}")
            skipped += 1

    db.commit()

    return {
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }
