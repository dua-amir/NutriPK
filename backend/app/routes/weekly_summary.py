from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.user import get_current_user
from app.models.nutrients import Nutrients
from app.models.models import Meal
from app.utils.db import get_db
from pymongo.database import Database

router = APIRouter()

@router.get("/api/user/weekly-summary")
def weekly_summary(email: str = Query(...), db: Database = Depends(get_db)):
    # Get current week (Monday 00:00 to Sunday 23:59)
    now = datetime.now()
    day_of_week = now.weekday() # 0=Mon, 6=Sun
    monday = now - timedelta(days=day_of_week)
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    week_days = [(monday + timedelta(days=i)) for i in range(7)]
    # Query meals for user in current week
    meals = list(db.meals.find({
        "email": email,
        "timestamp": {"$gte": week_days[0], "$lt": week_days[-1] + timedelta(days=1)}
    }))
    # Prepare daily summary
    summary = []
    for d in week_days:
        day_start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_meals = [m for m in meals if day_start <= m["timestamp"] < day_end]
        total_calories = total_protein = total_carbs = total_fats = 0
        for meal in day_meals:
            nutrients = meal.get("nutrients", {})
            for k, v in nutrients.items():
                lk = k.lower()
                if "calor" in lk:
                    total_calories += float(v) if v else 0
                if "protein" in lk:
                    total_protein += float(v) if v else 0
                if "carbo" in lk or "carb" in lk:
                    total_carbs += float(v) if v else 0
                if "fat" in lk:
                    total_fats += float(v) if v else 0
        summary.append({
            "day": day_start.strftime("%a %d %b"),
            "count": len(day_meals),
            "totalCalories": total_calories,
            "totalProtein": total_protein,
            "totalCarbs": total_carbs,
            "totalFats": total_fats,
        })
    # Totals for the week
    totals = {
        "calories": sum(d["totalCalories"] for d in summary),
        "protein": sum(d["totalProtein"] for d in summary),
        "carbs": sum(d["totalCarbs"] for d in summary),
        "fats": sum(d["totalFats"] for d in summary),
        "meals": sum(d["count"] for d in summary),
    }
    return {"summary": summary, "totals": totals}
