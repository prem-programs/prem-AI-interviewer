# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend + Serve Built React App
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (for audio/speech processing & build support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies & install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application files
COPY backend ./backend

# Copy compiled frontend dist from Stage 1 into backend's expected directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set pythonpath
ENV PYTHONPATH=/app

# Railway exposes dynamic PORT environment variable
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
