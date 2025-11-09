from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta, timezone
from app.utils.db import get_db
from pymongo.database import Database
from dateutil.parser import parse
import pytz

router = APIRouter()

@router.get("/weekly-summary")
def weekly_summary(email: str = Query(...), db: Database = Depends(get_db)):
    # Get current week boundaries in Asia/Karachi (Monday 00:00 to next Monday 00:00)
    tz_pk = pytz.timezone('Asia/Karachi')
    now_pk = datetime.now(tz_pk)
    day_of_week = now_pk.weekday()  # 0=Mon, 6=Sun
    # start of Monday in PK tz
    monday_pk = (now_pk - timedelta(days=day_of_week)).replace(hour=0, minute=0, second=0, microsecond=0)
    # Build list of day starts in PK tz
    week_days_pk = [(monday_pk + timedelta(days=i)) for i in range(7)]
    # Convert PK day boundaries to UTC naive datetimes for comparison with stored UTC timestamps
    week_days = [d.astimezone(pytz.utc).replace(tzinfo=None) for d in week_days_pk]
    # Fetch all meals for user
    meals = list(db.meals.find({"email": email}))
    print(f"DEBUG: Meals fetched for {email} => {meals}")
    # Prepare daily summary
    summary = []
    for d in week_days:
        # d is already the day start (UTC naive) corresponding to PK midnight
        day_start = d
        day_end = day_start + timedelta(days=1)
        day_meals = []
        for m in meals:
            ts = m.get("timestamp")
            print(f"DEBUG: Meal timestamp raw: {ts}, type: {type(ts)}")
            if not ts:
                print(f"DEBUG: Skipping meal with missing timestamp: {m}")
                continue
            # Parse string timestamps and normalize to UTC naive datetimes for comparison
            if isinstance(ts, str):
                try:
                    ts_parsed = parse(ts)
                    print(f"DEBUG: Parsed timestamp: {ts_parsed}")
                    # If parsed ts has tzinfo, convert to UTC and drop tzinfo
                    if ts_parsed.tzinfo is not None:
                        ts = ts_parsed.astimezone(pytz.utc).replace(tzinfo=None)
                    else:
                        # assume naive timestamps are in UTC
                        ts = ts_parsed
                except Exception as e:
                    print(f"DEBUG: Failed to parse timestamp: {ts}, error: {e}")
                    continue
            # If timestamp stored as datetime, assume it's UTC naive and compare directly
            if isinstance(ts, datetime) and day_start <= ts < day_end:
                day_meals.append(m)
        print(f"DEBUG: Meals for {day_start.strftime('%a %d %b')}: {day_meals}")
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
        # water for the day (stored with date string YYYY-MM-DD in water collection)
        try:
            day_pk = day_start.astimezone(pytz.utc) if day_start.tzinfo else pytz.utc.localize(day_start)
        except Exception:
            day_pk = day_start
        # compute PK local date string
        pk_date = (day_start + timedelta(0)).strftime('%Y-%m-%d')
        water_doc = db.water.find_one({"email": email, "date": pk_date}) if hasattr(db, 'water') else None
        water_count = water_doc.get('glasses') if water_doc else 0

        summary.append({
            "day": day_start.strftime("%a %d %b"),
            "count": len(day_meals),
            "totalCalories": total_calories,
            "totalProtein": total_protein,
            "totalCarbs": total_carbs,
            "totalFats": total_fats,
            "waterGlasses": int(water_count or 0),
        })
    # Totals for the week
    totals = {
        "calories": sum(d["totalCalories"] for d in summary),
        "protein": sum(d["totalProtein"] for d in summary),
        "carbs": sum(d["totalCarbs"] for d in summary),
        "fats": sum(d["totalFats"] for d in summary),
        "meals": sum(d["count"] for d in summary),
        "waterGlasses": sum(d.get("waterGlasses", 0) for d in summary),
    }
    print(f"DEBUG: Weekly summary: {summary}")
    print(f"DEBUG: Weekly totals: {totals}")
    return {"summary": summary, "totals": totals}
