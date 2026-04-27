# חסכון חכם

אגרגטור השוואת מחירים עם הטבות מועדוני לקוחות.  
המשתמש מחפש מוצר ורואה את המחיר הטוב ביותר בהתאם למועדונים שהוא חבר בהם.

---

## קישורים לסביבת הייצור

| שירות | כתובת |
|--------|--------|
| פרונטאנד | https://frontend-indol-zeta-88.vercel.app |
| בקאנד | https://smart-saver-8wde.onrender.com |
| תיעוד API | https://smart-saver-8wde.onrender.com/docs |

---

## מחסנית טכנולוגית

| שכבה | טכנולוגיה | פריסה |
|------|-----------|-------|
| פרונטאנד | React + Vite | Vercel |
| בקאנד | FastAPI (Python 3.11) | Render |
| מסד נתונים | PostgreSQL | Supabase |

---

## מבנה הפרויקט

```
חיסכון/
├── backend/
│   ├── app/
│   │   ├── models/         # טבלאות מסד הנתונים (SQLAlchemy ORM)
│   │   ├── routers/        # נקודות קצה של ה-API
│   │   │   ├── auth.py     # הרשמה, כניסה, גוגל OAuth
│   │   │   ├── search.py   # חיפוש מוצרים ומבצעים
│   │   │   ├── profile.py  # מועדונים, פעילות, קליקים
│   │   │   ├── wishlist.py # רשימת מועדפים
│   │   │   ├── reports.py  # דיווח על שגיאות והצעות
│   │   │   ├── admin.py    # פאנל ניהול
│   │   │   └── import_data.py # ייבוא נתונים מקובץ
│   │   ├── schemas/        # סכמות קלט/פלט (Pydantic)
│   │   ├── auth.py         # JWT, bcrypt, הרשאות
│   │   ├── database.py     # חיבור למסד הנתונים
│   │   ├── main.py         # נקודת הכניסה לשרת
│   │   └── setup_clubs.py  # סקריפט חד-פעמי: הוספת רשתות ומועדונים
│   ├── migrations/         # גרסאות מסד הנתונים (Alembic)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # רכיבים משותפים
│   │   ├── pages/          # דפי האפליקציה
│   │   └── context/        # ניהול מצב גלובלי (Auth)
│   ├── vercel.json         # העברת בקשות API ל-Render
│   └── package.json
└── render.yaml             # הגדרות פריסה ל-Render
```

---

## הפעלה מקומית

### דרישות מקדימות
- Python 3.11 ומעלה
- PostgreSQL פעיל מקומית
- Node 18 ומעלה

### בקאנד

```bash
cd backend
pip install -r requirements.txt
```

צור קובץ `.env` ומלא את הפרטים:

```
DATABASE_URL=postgresql://postgres:סיסמה@localhost:5432/hachaskon_chacham
SECRET_KEY=מחרוזת-סודית-ארוכה
GOOGLE_CLIENT_ID=מזהה-גוגל-שלך
```

הפעלת השרת:

```bash
uvicorn app.main:app --reload
```

השרת יעלה בכתובת: `http://localhost:8000`  
תיעוד ממשק: `http://localhost:8000/docs`

### פרונטאנד

```bash
cd frontend
npm install
npm run dev
```

הממשק יעלה בכתובת: `http://localhost:5173`

---

## משתני סביבה בייצור

### ב-Render (בקאנד)

| משתנה | תיאור |
|--------|--------|
| `DATABASE_URL` | כתובת החיבור ל-Supabase |
| `SECRET_KEY` | מפתח סודי ל-JWT |
| `GOOGLE_CLIENT_ID` | Client ID מ-Google Cloud Console |
| `FRONTEND_URL` | כתובת הפרונטאנד ב-Vercel |

### ב-Vercel (פרונטאנד)

| משתנה | תיאור |
|--------|--------|
| `VITE_GOOGLE_CLIENT_ID` | Client ID מ-Google Cloud Console |

---

## ניהול מסד הנתונים

### מיגרציות (Alembic)

יצירת גרסה חדשה לאחר שינוי במודלים:

```bash
cd backend
alembic revision --autogenerate -m "תיאור השינוי"
alembic upgrade head
```

חזרה לגרסה קודמת:

```bash
alembic downgrade -1
```

### אתחול נתונים ראשוניים

להוספת רשתות ומועדונים והגדרת משתמש כאדמין (מריצים פעם אחת):

```bash
cd backend
python -m app.setup_clubs
```

---

## הרשאות משתמשים

| תפקיד | הרשאות |
|--------|--------|
| `user` | חיפוש, מועדפים, מועדונים |
| `editor` | + ניהול מוצרים ומבצעים |
| `admin` | גישה מלאה לפאנל הניהול |

כניסה לפאנל הניהול: `/#admin` או כפתור ניהול למשתמש admin/editor.
