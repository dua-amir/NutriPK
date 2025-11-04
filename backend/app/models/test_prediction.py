import requests
import os
from pathlib import Path
import time
import random

def find_test_images():
    """Find available test images from the dataset"""
    dataset_path = Path(__file__).parent.parent.parent.parent / "dataset"  # Fixed path to dataset folder
    categories = []
    
    # List all directories in dataset folder
    for item in dataset_path.iterdir():
        if item.is_dir():
            # Check if directory has any images
            images = list(item.glob("*.jpg")) + list(item.glob("*.jpeg")) + list(item.glob("*.png"))
            if images:
                categories.append(item.name)
    
    return dataset_path, categories

def test_prediction(dataset_path, category_name):
    """Test prediction for a single category"""
    URL = "http://localhost:8000/api/dish/predict/"
    
    # Find all images in the category folder
    image_path = dataset_path / category_name
    images = list(image_path.glob("*.jpg")) + list(image_path.glob("*.jpeg")) + list(image_path.glob("*.png"))
    
    if not images:
        print(f"⚠️ No images found in {category_name} folder")
        return
    
    # Select a random image
    test_image_path = random.choice(images)
    print(f"\n🔍 Testing with {category_name} image: {test_image_path.name}")
    
    # Create the files payload
    with open(test_image_path, 'rb') as img_file:
        files = {
            'file': (test_image_path.name, img_file, 'image/jpeg')
        }
        
        # Make the request
        try:
            start_time = time.time()
            response = requests.post(URL, files=files)
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Prediction successful! ({(end_time - start_time):.2f} seconds)")
                print(f"🏆 Top prediction: {result['dish']} ({result['confidence']*100:.1f}% confidence)")
                print("\n🔝 Top 3 predictions:")
                for pred in result['top_predictions']:
                    print(f"   • {pred['dish']}: {pred['confidence']*100:.1f}%")
                
                # Check if prediction matches actual category
                if result['dish'] == category_name:
                    print("✨ Correct prediction!")
                else:
                    print(f"❗ Expected {category_name}, but model predicted {result['dish']}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error making request: {e}")

def main():
    print("🚀 Starting prediction tests...")
    
    # Find available test categories
    dataset_path, categories = find_test_images()
    print(f"📁 Found {len(categories)} categories: {', '.join(categories)}")
    
    # Select some categories to test
    test_categories = random.sample(categories, min(3, len(categories)))
    print(f"🎯 Will test with categories: {', '.join(test_categories)}\n")
    
    # Run tests
    for category in test_categories:
        test_prediction(dataset_path, category)

if __name__ == "__main__":
    main()