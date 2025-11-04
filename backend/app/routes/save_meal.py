from fastapi import APIRouter, Depends, File, UploadFile, Form
from datetime import datetime, timezone
from app.utils.db import get_db
from pymongo.database import Database
import os
import json
import uuid
from dateutil.parser import parse as parse_dt

router = APIRouter()


@router.post("/save-meal")
async def save_meal(
    name: str = Form(...),
    nutrients: str = Form(None),
    timestamp: str = Form(None),
    email: str = Form(...),
    image: UploadFile = File(None),
    db: Database = Depends(get_db),
):
    meal = {
        "name": name,
        "email": email,
    }

    # parse nutrients if provided (JSON string)
    if nutrients:
        try:
            meal["nutrients"] = json.loads(nutrients)
        except Exception:
            meal["nutrients"] = nutrients

    # parse timestamp (normalize to UTC naive datetime)
    if timestamp:
        try:
            ts_parsed = parse_dt(timestamp)
            # If timestamp has tzinfo, convert to UTC then strip tzinfo to store as naive UTC
            if ts_parsed.tzinfo is not None:
                ts_utc = ts_parsed.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                # assume naive timestamps are already in UTC
                ts_utc = ts_parsed
            meal["timestamp"] = ts_utc
        except Exception:
            # fallback to current UTC time
            meal["timestamp"] = datetime.utcnow()
    else:
        meal["timestamp"] = datetime.utcnow()

    # handle uploaded image: save to disk and set public static path
    if image:
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        img_name = f"{uuid.uuid4().hex}{ext}"
        folder = os.path.join("app", "models", "meal_images")
        os.makedirs(folder, exist_ok=True)
        img_path = os.path.join(folder, img_name)
        with open(img_path, "wb") as f:
            f.write(await image.read())
        image_url = f"/static/meal_images/{img_name}"
        meal["image"] = image_url
    else:
        # No uploaded file - allow client to provide an image URL via form (not recommended)
        meal["image"] = None

    result = db.meals.insert_one(meal)
    meal["_id"] = str(result.inserted_id)
    return {"status": "success", "meal": meal}
