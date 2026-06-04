from pydantic import BaseModel
from typing import Dict

class PredictionResponse(BaseModel):
    clase_predicha: str
    probabilidad_maxima: float  # Percentage (0-100)
    probabilidades_totales: Dict[str, float]  # ClassName -> Percentage (0-100)
    tiempo_inferencia: float  # In milliseconds (ms)
    model_name: str
