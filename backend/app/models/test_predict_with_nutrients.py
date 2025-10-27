import json
from pathlib import Path

from app.models.prediction import DishPredictor

# nutrients loader may or may not be present
try:
    from app.models.nutrients import get_nutrients_for
except Exception:
    get_nutrients_for = None

if __name__ == '__main__':
    sample = Path(__file__).parent.parent.parent / 'dataset' / 'aloo_ghost' / 'image (1).jpg'
    # fallback if relative path not correct
    if not sample.exists():
        # try other relative
        sample = Path.cwd() / 'dataset' / 'aloo_ghost' / 'image (1).jpg'

    print('Using sample image:', sample)

    predictor = DishPredictor()
    result = predictor.predict(str(sample))

    if get_nutrients_for is not None and 'dish' in result:
        nutrients = get_nutrients_for(result['dish'])
        if nutrients:
            result['nutrients'] = nutrients

    print(json.dumps(result, indent=2, ensure_ascii=False))
