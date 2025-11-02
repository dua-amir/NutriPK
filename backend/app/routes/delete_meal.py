from fastapi import APIRouter, Depends, Query, HTTPException
from app.utils.db import get_db
from pymongo.database import Database
from bson import ObjectId

router = APIRouter()

@router.delete("/delete-meal")
def delete_meal(meal_id: str = Query(...), db: Database = Depends(get_db)):
    # Try to delete by ObjectId
    try:
        result = db.meals.delete_one({"_id": ObjectId(meal_id)})
        if result.deleted_count == 0:
            # Try to delete by string _id (if not ObjectId)
            result = db.meals.delete_one({"_id": meal_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Meal not found")
        return {"status": "success", "deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
