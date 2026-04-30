"""
הרץ פעם אחת כדי להוסיף עמודת search_keywords לטבלת products:
    python -m app.migrations.add_search_keywords
"""
from app.database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN search_keywords VARCHAR"))
            conn.commit()
            print("✅ עמודת search_keywords נוספה בהצלחה")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ️ העמודה כבר קיימת — לא צריך לעשות כלום")
            else:
                raise

if __name__ == "__main__":
    run()
