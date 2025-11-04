"""Balance dataset by augmenting classes that have fewer than target_count images.

This script will create augmented images inside the class folders to reach the desired
minimum sample count per class. It's a quick way to increase per-class data and reduce
class imbalance before retraining.

Usage:
  python balance_dataset.py --target 200 --img-size 224
"""
from pathlib import Path
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img
import argparse
import random

DATASET_PATH = Path(__file__).parent.parent.parent.parent / "dataset"


def augment_class_folder(folder: Path, target: int, img_size: int, datagen: ImageDataGenerator):
    images = list(folder.glob('*'))
    images = [p for p in images if p.suffix.lower() in ('.jpg', '.jpeg', '.png')]
    count = len(images)
    if count >= target:
        return 0

    to_create = target - count
    print(f"Augmenting {folder.name}: {count} -> {target} ({to_create} images)")

    created = 0
    i = 0
    while created < to_create:
        src = random.choice(images)
        try:
            img = load_img(src, target_size=(img_size, img_size))
            arr = img_to_array(img)
            arr = arr.reshape((1,) + arr.shape)
            # Generate one augmented image
            it = datagen.flow(arr, batch_size=1)
            batch = next(it)
            out = batch[0]
            # Convert pixel range back to 0-255 and save
            from PIL import Image
            out_img = Image.fromarray((out * 255).astype('uint8'))
            save_name = folder / f"aug_{i}_{src.name}"
            out_img.save(save_name)
            created += 1
            i += 1
        except Exception as e:
            print(f"Failed to augment {src}: {e}")
            # skip this image
            continue

    return created


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', type=int, default=200, help='Target images per class')
    parser.add_argument('--img-size', type=int, default=224)
    parser.add_argument('--preview', action='store_true', help='Only print counts, do not create images')
    args = parser.parse_args()

    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        brightness_range=(0.8, 1.2)
    )

    classes = [p for p in DATASET_PATH.iterdir() if p.is_dir()]
    total_created = 0
    for cls in classes:
        images = [p for p in cls.glob('*') if p.suffix.lower() in ('.jpg', '.jpeg', '.png')]
        count = len(images)
        print(f"{cls.name}: {count} images")
        if not args.preview:
            created = augment_class_folder(cls, args.target, args.img_size, datagen)
            total_created += created

    print(f"Total augmented images created: {total_created}")


if __name__ == '__main__':
    main()
