import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from app.schemas import PredictionResponse
from app.model_loader import ModelLoader

# Initialize the ModelLoader
model_container = ModelLoader()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load Keras model into memory once
    try:
        model_container.load_model()
    except Exception as e:
        print(f"CRITICAL: Failed to load model at startup: {e}")
    yield
    # Shutdown: Clean up if necessary
    if model_container.model is not None:
        del model_container.model

app = FastAPI(
    title="CIFAR-10 Image Recognition API",
    description="FastAPI Backend for image classification using Keras model.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS to allow requests from any origin in production (wildcard) for Capacitor and PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using wildcard "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the CIFAR-10 Image Recognition API",
        "status": "online"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model_container.model is not None
    }

@app.post("/api/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict(file: UploadFile = File(...)):
    # 1. Validate that a file is uploaded
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionó ningún archivo."
        )
    
    # 2. Validate MIME type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo proporcionado debe ser una imagen. Tipo recibido: {file.content_type}"
        )
    
    # 3. Read image bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error leyendo los bytes de la imagen: {str(e)}"
        )
    
    # 4. Validate image parsing
    try:
        # Check if PIL can open the image
        img = Image.open(io.BytesIO(contents))
        img.verify()  # Verify image integrity
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no es una imagen válida o está dañado."
        )
    
    # 5. Run inference
    if model_container.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo de clasificación no está cargado en el servidor."
        )
        
    try:
        # Pass a seeked stream of image bytes
        result = model_container.predict_image(io.BytesIO(contents))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la predicción del modelo: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    import os
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server dynamically on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
