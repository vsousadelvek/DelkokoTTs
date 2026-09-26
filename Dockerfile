# Stage 1: build the frontend
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: backend + models + built frontend
FROM python:3.11-slim

# espeak-ng is required by kokoro-onnx for phonemization
RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak-ng curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY scripts/download_models.sh scripts/download_models.sh
RUN bash scripts/download_models.sh backend/storage/models

COPY --from=frontend /app/frontend/dist frontend/dist

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend"]
