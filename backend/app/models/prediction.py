from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the model file
MODEL_PATH = Path(__file__).parent / "model.keras"

# List of classes/dishes that the model can predict
CLASSES = [
    "aloo_ghost", "aloo_matar", "anda_paratha", "bhindi_masala", 
    "biryani", "boil_egg", "chai", "chana_masala", "chapati",
    "daal", "daal_chawal", "fries", "gajar_ka_halwa", "gulab_jamun",
    "haleem", "kabab", "kofta", "leafy_vegies", "mix_sabzi",
    "paani_puri", "paratha", "paya", "plain_white_rice", "qorma", "samosa"
]

class DishPredictor:
    def __init__(self):
        try:
            self.model = load_model(MODEL_PATH)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

    def preprocess_image(self, img_path):
        """Preprocess the image to match model's requirements"""
        try:
            img = image.load_img(img_path, target_size=(224, 224))  # Adjust size as per your model
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0  # Normalize pixel values
            return img_array
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise

    def predict(self, img_path):
        """Predict the dish from an image"""
        try:
            processed_image = self.preprocess_image(img_path)
            predictions = self.model.predict(processed_image)
            predicted_class_index = np.argmax(predictions[0])
            predicted_class = CLASSES[predicted_class_index]
            confidence = float(predictions[0][predicted_class_index])
            
            return {
                "dish": predicted_class,
                "confidence": confidence,
                "top_predictions": [
                    {
                        "dish": CLASSES[i],
                        "confidence": float(predictions[0][i])
                    }
                    for i in np.argsort(predictions[0])[-3:][::-1]  # Top 3 predictions
                ]
            }
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            raise