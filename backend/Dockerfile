# Use official lightweight Python base image
FROM python:3.10-slim

# Set environment variables for Python and Port
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Set working directory inside container
WORKDIR /app

# Install system dependencies needed for compiling python packages if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements list
COPY requirements.txt .

# Install pip dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend app folder (contains main.py, model_loader.py, and the copied .keras model)
COPY app/ ./app/

# Expose default port
EXPOSE 8000

# Run uvicorn dynamically binding to the port assigned by Render ($PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
