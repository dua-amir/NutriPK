from fastapi import APIRouter, Depends, Query
from app.utils.db import get_db
from pymongo.database import Database

router = APIRouter()

@router.get("/api/user/all-meals")
def all_meals(email: str = Query(...), db: Database = Depends(get_db)):
    meals = list(db.meals.find({"email": email}))
    # Convert ObjectId and datetime to string for frontend
    for m in meals:
        m["_id"] = str(m["_id"])
        if "timestamp" in m:
            m["timestamp"] = str(m["timestamp"])
    return {"meals": meals}
