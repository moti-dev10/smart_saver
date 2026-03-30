# חסכון חכם

אגרגטור השוואת מחירים עם הטבות מועדוני לקוחות.

---

## דרישות מקדימות

- גרסת פייתון 3.11 ומעלה
- שרת פוסטגרס מקומי פעיל
- גרסת נוד 18 ומעלה

---

## הפעלת הבאקאנד

```bash
cd backend
pip install -r requirements.txt
```

צור קובץ `.env` על בסיס `.env.example` ומלא את הפרטים:

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

---

## הפעלת הפרונטאנד

```bash
cd frontend
npm install
npm run dev
```

הממשק יעלה בכתובת: `http://localhost:5173`

---

## ניהול גרסאות מסד הנתונים

יצירת גרסה חדשה לאחר שינוי במודלים:

```bash
cd backend
alembic revision --autogenerate -m "תיאור השינוי"
```

הרצת כל הגרסאות הממתינות:

```bash
alembic upgrade head
```

חזרה לגרסה קודמת:

```bash
alembic downgrade -1
```

---

## מבנה הפרויקט

```
חיסכון/
├── backend/
│   ├── app/
│   │   ├── models/       # טבלאות מסד הנתונים
│   │   ├── routers/      # נקודות קצה של ה-API
│   │   ├── schemas/      # סכמות קלט/פלט
│   │   ├── auth.py       # לוגיקת אימות
│   │   ├── database.py   # חיבור למסד הנתונים
│   │   └── main.py       # נקודת הכניסה לשרת
│   ├── migrations/       # גרסאות מסד הנתונים
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/   # רכיבים משותפים
    │   ├── pages/        # דפי האפליקציה
    │   └── context/      # ניהול מצב גלובלי
    └── package.json
```
