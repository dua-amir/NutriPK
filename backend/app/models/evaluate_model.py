import argparse
from pathlib import Path
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
import json
import math

DATASET_PATH = Path(__file__).parent.parent.parent.parent / "dataset"


def main():
    parser = argparse.ArgumentParser(description='Evaluate a saved Keras model on validation set')
    parser.add_argument('--model', type=str, default=str(Path(__file__).parent / 'model.keras'),
                        help='Path to the saved model (default: models/model.keras)')
    parser.add_argument('--img-size', type=int, default=224)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--subset', type=str, default='validation', choices=['training', 'validation'],
                        help='Which subset to evaluate (uses ImageDataGenerator split)')

    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"Model file not found: {model_path}")
        return

    print(f"Loading model from: {model_path}")
    model = load_model(str(model_path))

    datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)
    generator = datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        class_mode='categorical',
        subset=args.subset,
        shuffle=False
    )

    steps = math.ceil(generator.samples / args.batch_size)
    print(f"Evaluating on {generator.samples} images (steps={steps})")

    loss, acc = model.evaluate(generator, steps=steps, verbose=1)
    print(f"Evaluation results - loss: {loss:.4f}  accuracy: {acc:.4f}")

    # Predict and compute confusion matrix/report if sklearn available
    print('Computing predictions for detailed report...')
    preds = model.predict(generator, steps=steps, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = generator.classes

    # Print the class indices mapping so you know which class maps to which index
    print('\nClass indices mapping (class_name -> index):')
    print(json.dumps(generator.class_indices, indent=2))

    # Try sklearn metrics
    try:
        from sklearn.metrics import classification_report, confusion_matrix
        target_names = [k for k, v in sorted(generator.class_indices.items(), key=lambda x: x[1])]
        print('\nClassification report:')
        print(classification_report(y_true, y_pred, target_names=target_names, digits=4))
        print('\nConfusion matrix:')
        cm = confusion_matrix(y_true, y_pred)
        print(cm)
    except Exception as e:
        print('sklearn not available, printing simple per-class accuracies instead')
        # compute per-class accuracy
        classes = sorted(generator.class_indices.items(), key=lambda x: x[1])
        class_counts = {i: 0 for _, i in classes}
        class_correct = {i: 0 for _, i in classes}
        for t, p in zip(y_true, y_pred):
            class_counts[t] += 1
            if t == p:
                class_correct[t] += 1
        for name, idx in classes:
            cnt = class_counts.get(idx, 0)
            corr = class_correct.get(idx, 0)
            acc_c = (corr / cnt) if cnt > 0 else 0.0
            print(f"{name}: {corr}/{cnt} correct  acc={acc_c:.4f}")


if __name__ == '__main__':
    main()
