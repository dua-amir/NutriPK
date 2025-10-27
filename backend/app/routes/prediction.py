from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import os
from tempfile import NamedTemporaryFile
from ..models.prediction import DishPredictor

router = APIRouter()
predictor = None

@router.on_event("startup")
async def startup_event():
    global predictor
    try:
        predictor = DishPredictor()
    except Exception as e:
        print(f"Error loading model: {e}")

@router.post("/predict/")
async def predict_dish(file: UploadFile = File(..., description="Image file to predict")):
    """
    Upload an image and get dish predictions
    """
    # Debug information
    print("Request received for prediction")
    print(f"File details:")
    print(f"- Filename: {file.filename}")
    print(f"- Content type: {file.content_type}")
    print(f"- Size: {file.size if hasattr(file, 'size') else 'unknown'}")

    # Validate file
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
        
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="No content type provided"
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"File must be an image. Received content-type: {file.content_type}"
        )
    
    try:
        print("Creating temporary file...")
        # Create a temporary file to store the uploaded image
        with NamedTemporaryFile(delete=False) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        print(f"Temporary file created at: {temp_path}")
        print("Making prediction...")
        # Make prediction
        result = predictor.predict(temp_path)
        
        # Clean up the temporary file
        print("Cleaning up temporary file...")
        os.unlink(temp_path)
        
        return result
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))