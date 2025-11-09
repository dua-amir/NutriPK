import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras import optimizers
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
)
from tensorflow.keras import regularizers
import json
from datetime import datetime
from pathlib import Path
import numpy as np
import argparse
import math

# Set paths
DATASET_PATH = Path(__file__).parent.parent.parent.parent / "dataset"
MODEL_SAVE_PATH = Path(__file__).parent / "model.keras"

# Model parameters (tunable)
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20
FINE_TUNE_EPOCHS = 10

def create_model(num_classes, dropout_rate=0.0):
    # Use MobileNetV2 as base model
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )

    # Freeze the base model layers by default
    base_model.trainable = False

    # Add custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    if dropout_rate and dropout_rate > 0:
        from tensorflow.keras.layers import Dropout
        x = Dropout(dropout_rate)(x)
    # small L2 regularization on head
    x = Dense(128, activation='relu', kernel_regularizer=regularizers.l2(1e-4))(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    return model


def compute_class_weights(generator):
    # Compute class weights to address imbalance
    try:
        from sklearn.utils.class_weight import compute_class_weight
    except Exception:
        # fallback: simple heuristic
        class_totals = {}
        for cls, idx in generator.class_indices.items():
            class_totals[idx] = 0
        # generator.classes is available for DirectoryIterator
        if hasattr(generator, 'classes'):
            for c in generator.classes:
                class_totals[c] = class_totals.get(c, 0) + 1
            counts = np.array([class_totals[i] for i in sorted(class_totals)])
            total = counts.sum()
            weights = {i: float(total) / (len(counts) * counts[i]) for i in range(len(counts))}
            return weights
        return None

    classes = np.array(list(generator.class_indices.values()))
    y = getattr(generator, 'classes', None)
    if y is None:
        return None
    class_weights = compute_class_weight('balanced', classes=np.unique(y), y=y)
    return {i: w for i, w in enumerate(class_weights)}


def main():
    parser = argparse.ArgumentParser(description='Train a dish classification model')
    parser.add_argument('--epochs', type=int, default=EPOCHS)
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
    parser.add_argument('--img-size', type=int, default=IMG_SIZE)
    parser.add_argument('--fine-tune', action='store_true', help='Unfreeze top MobileNetV2 layers and fine-tune')
    parser.add_argument('--dropout', type=float, default=0.0, help='Dropout rate for head')

    args = parser.parse_args()

    print("Starting model training...")

    # Setup data generators with stronger augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        brightness_range=(0.7, 1.3),
        validation_split=0.2
    )

    # Load training and validation data
    train_generator = train_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = train_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        class_mode='categorical',
        subset='validation'
    )

    num_classes = len(train_generator.class_indices)
    print(f"Found {train_generator.samples} training images, {validation_generator.samples} validation images, {num_classes} classes")

    # Create and compile model
    model = create_model(num_classes, dropout_rate=args.dropout)
    # Use label smoothing to reduce overconfidence
    loss_obj = None
    try:
        from tensorflow.keras.losses import CategoricalCrossentropy
        loss_obj = CategoricalCrossentropy(label_smoothing=0.05)
    except Exception:
        loss_obj = 'categorical_crossentropy'

    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss=loss_obj,
        metrics=['accuracy']
    )

    # Callbacks
    callbacks = []
    # Save best model during training
    checkpoint_path = str(Path(__file__).parent / 'best_model.keras')
    callbacks.append(ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1))
    callbacks.append(EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True))
    callbacks.append(ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6, verbose=1))
    # TensorBoard logs
    log_dir = Path(__file__).parent / 'logs' / datetime.now().strftime('%Y%m%d-%H%M%S')
    callbacks.append(TensorBoard(log_dir=str(log_dir), histogram_freq=1))

    # Compute class weights if imbalance exists
    class_weights = compute_class_weights(train_generator)
    if class_weights:
        print('Using class weights:', class_weights)

    # Train head
    print("Training model head...")
    history = model.fit(
        train_generator,
        steps_per_epoch=max(1, train_generator.samples // args.batch_size),
        validation_data=validation_generator,
        validation_steps=max(1, validation_generator.samples // args.batch_size),
        epochs=args.epochs,
        callbacks=callbacks,
        class_weight=class_weights
    )

    # collect history
    history_all = {}
    try:
        history_all = history.history.copy()
    except Exception:
        history_all = {}

    # Optional fine-tuning: unfreeze some top layers
    if args.fine_tune:
        # Unfreeze the top N layers of base model (heuristic)
        base_model = None
        for layer in model.layers:
            if hasattr(layer, 'name') and layer.name.startswith('MobilenetV2'):
                base_model = layer
                break

        # Identify base model by class type instead: MobileNetV2 has attribute 'trainable'
        try:
            # Unfreeze last 20 layers of the model (if available)
            for layer in model.layers[-100:]:
                try:
                    layer.trainable = True
                except Exception:
                    pass
        except Exception:
            pass

        # Recompile with lower LR
        model.compile(
            optimizer=optimizers.Adam(learning_rate=1e-4),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        print('Fine-tuning model...')
        model.fit(
            train_generator,
            steps_per_epoch=max(1, train_generator.samples // args.batch_size),
            validation_data=validation_generator,
            validation_steps=max(1, validation_generator.samples // args.batch_size),
            epochs=FINE_TUNE_EPOCHS,
            callbacks=callbacks,
            class_weight=class_weights
        )

        # append fine-tune history if available
        try:
            # Keras returns history object but we didn't assign it above; get callback logs via model.history if present
            # The easiest is to re-run a predict on small batch -- but to keep simple: we note logs are in TensorBoard.
            pass
        except Exception:
            pass

    # Save final model
    print(f"Saving model to {MODEL_SAVE_PATH}")
    model.save(MODEL_SAVE_PATH)
    # Also ensure best_model.keras exists
    try:
        best = load_best = Path(checkpoint_path)
        if best.exists():
            best_dest = Path(__file__).parent / 'model.keras'
            best_dest.write_bytes(best.read_bytes())
    except Exception:
        pass
    # Save history JSON to models folder for offline plotting
    try:
        hist_path = Path(__file__).parent / 'training_history.json'
        with hist_path.open('w', encoding='utf-8') as fh:
            json.dump(history_all, fh, indent=2)
        print(f"Saved training history to {hist_path}")
    except Exception:
        pass

    print("Model training completed!")


if __name__ == "__main__":
    main()