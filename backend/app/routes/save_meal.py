from fastapi import APIRouter, Depends, Body
from datetime import datetime
from app.utils.db import get_db
from pymongo.database import Database

router = APIRouter()

@router.post("/api/user/save-meal")
def save_meal(meal: dict = Body(...), db: Database = Depends(get_db)):
    # Ensure timestamp is a datetime object
    ts = meal.get("timestamp")
    if isinstance(ts, str):
        try:
            # Try parsing ISO format first
            meal["timestamp"] = datetime.fromisoformat(ts)
        except Exception:
            # Fallback for custom formats
            try:
                meal["timestamp"] = datetime.strptime(ts, "%d/%m/%Y, %I:%M:%S %p")
            except Exception:
                meal["timestamp"] = datetime.now()
    db.meals.insert_one(meal)
    return {"status": "success"}
