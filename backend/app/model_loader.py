import os
import time
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input

# Monkey-patch Keras Dense layer constructor to handle quantization_config deserialization mismatch
import keras
original_dense_init = keras.layers.Dense.__init__

def custom_dense_init(self, *args, **kwargs):
    if 'quantization_config' in kwargs:
        kwargs.pop('quantization_config')
    original_dense_init(self, *args, **kwargs)

keras.layers.Dense.__init__ = custom_dense_init

# CIFAR-10 Class Names (Notebook Definition)
CLASS_NAMES = [
    'Avión',      # Airplane
    'Automóvil',  # Automobile
    'Pájaro',     # Bird
    'Gato',       # Cat
    'Ciervo',     # Deer
    'Perro',      # Dog
    'Rana',       # Frog
    'Caballo',    # Horse
    'Barco',      # Ship
    'Camión'      # Truck
]

# Try loading from local app directory first (Docker deployment), then fallback to monorepo root path
MODEL_PATH_LOCAL = os.path.join(os.path.dirname(__file__), "modelo_final_cifar10.keras")
MODEL_PATH_MONOREPO = os.path.join(os.path.dirname(__file__), "..", "..", "modelo", "modelo_final_cifar10.keras")

if os.path.exists(MODEL_PATH_LOCAL):
    MODEL_PATH = os.path.abspath(MODEL_PATH_LOCAL)
else:
    MODEL_PATH = os.path.abspath(MODEL_PATH_MONOREPO)

class ModelLoader:
    def __init__(self):
        self.model = None
        self.class_names = CLASS_NAMES

    def load_model(self):
        """Loads the Keras model once at startup."""
        print(f"Loading Keras model from: {MODEL_PATH}")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        
        try:
            # Load the model with preprocess_input custom object
            self.model = tf.keras.models.load_model(
                MODEL_PATH, 
                custom_objects={'preprocess_input': preprocess_input}
            )
            print("Model loaded successfully into memory.")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    def predict_image(self, image_bytes) -> dict:
        """
        Preprocesses raw image bytes and runs model prediction.
        Returns a dict matching the PredictionResponse schema.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded in memory.")
        
        # 1. Load image using PIL and force RGB mode
        img = Image.open(image_bytes).convert("RGB")
        
        # 2. Resize to the exact input dimensions expected by the model (32x32) using LANCZOS resampling
        img_resized = img.resize((32, 32), Image.Resampling.LANCZOS)
        
        # 3. Convert image to numpy array of float32
        img_array = np.array(img_resized, dtype=np.float32)
        
        # 4. Expand dimensions to (1, 32, 32, 3) representing a batch of 1 image
        img_array = np.expand_dims(img_array, axis=0)
        
        # Note: We do not divide by 255.0 here because the model contains an 
        # internal preprocess_input lambda layer that handles values scaling.
        
        # 5. Measure inference execution time
        start_time = time.perf_counter()
        predictions = self.model.predict(img_array)
        end_time = time.perf_counter()
        
        inference_time_ms = (end_time - start_time) * 1000.0
        
        # 6. Extract predictions
        # predictions shape is (1, 10), get the first batch item
        probs = predictions[0]
        
        predicted_idx = int(np.argmax(probs))
        predicted_class = self.class_names[predicted_idx]
        confidence_percentage = float(probs[predicted_idx]) * 100.0
        
        # Create a dictionary mapping Class Name -> Percentage (0-100)
        probabilities_totales = {
            self.class_names[i]: float(probs[i]) * 100.0
            for i in range(len(self.class_names))
        }
        
        return {
            "clase_predicha": predicted_class,
            "probabilidad_maxima": round(confidence_percentage, 2),
            "probabilidades_totales": {k: round(v, 2) for k, v in probabilities_totales.items()},
            "tiempo_inferencia": round(inference_time_ms, 2),
            "model_name": "EfficientNetB0 (Fine-Tuning)"
        }
