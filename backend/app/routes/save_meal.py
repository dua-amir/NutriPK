from fastapi import APIRouter, Depends, File, UploadFile, Form
from datetime import datetime
from app.utils.db import get_db
from pymongo.database import Database
import os
import json
import uuid

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

    # parse timestamp
    if timestamp:
        if isinstance(timestamp, str):
            try:
                meal["timestamp"] = datetime.fromisoformat(timestamp)
            except Exception:
                try:
                    meal["timestamp"] = datetime.strptime(timestamp, "%d/%m/%Y, %I:%M:%S %p")
                except Exception:
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
