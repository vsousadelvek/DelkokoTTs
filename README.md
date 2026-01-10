# TTS Content Studio

Professional Text-to-Speech content creation platform powered by DELkokoOtimized Engine.
Optimized for CPU inference - perfect for VPS deployment.

## Features

- High-quality TTS with DELkokoOtimized Engine
- 11+ natural voices (American & British)
- Real-time audio preview
- Project management
- Job queue with progress tracking
- Modern React UI with dark theme
- CPU-optimized (ONNX Runtime)
- Docker ready for VPS deployment

## Tech Stack

**Backend:**
- FastAPI (Python 3.11+)
- DELkokoOtimized-ONNX (CPU optimized)
- SQLite + SQLAlchemy
- WebSocket for real-time updates

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

## Quick Start (Development)

### 1. Download Models

Download the TTS models from GitHub releases:
- `delkoko-v1.0.onnx` (310 MB)
- `voices-v1.0.bin` (27 MB)

Place them in `backend/storage/models/`

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### 4. Access the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Deployment (VPS)

### Using Docker Compose

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Deployment

1. **Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. **Frontend:**
```bash
cd frontend
npm ci
npm run build
# Serve dist/ folder with nginx
```

### Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/tts-studio/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/stats | System stats |
| GET | /api/tts/voices | List voices |
| POST | /api/tts/synthesize | Generate audio |
| POST | /api/tts/preview | Quick preview |
| GET | /api/projects/ | List projects |
| POST | /api/projects/ | Create project |
| GET | /api/jobs/ | List jobs |
| POST | /api/jobs/ | Create job |

## Available Voices

| Voice ID | Name | Gender | Accent |
|----------|------|--------|--------|
| af_heart | Heart | Female | American |
| af_bella | Bella | Female | American |
| af_nicole | Nicole | Female | American |
| af_sarah | Sarah | Female | American |
| af_sky | Sky | Female | American |
| am_adam | Adam | Male | American |
| am_michael | Michael | Male | American |
| bf_emma | Emma | Female | British |
| bf_isabella | Isabella | Female | British |
| bm_george | George | Male | British |
| bm_lewis | Lewis | Male | British |

## System Requirements

**Minimum (CPU Inference):**
- 4 CPU cores
- 4GB RAM
- 2GB disk space

**Recommended:**
- 6+ CPU cores
- 8GB RAM
- SSD storage

## Performance

- RTF (Real-Time Factor): ~15-25x on modern CPUs
- Latency: ~100-200ms for short texts
- Model size: ~80MB (ONNX Int8)

## License

MIT License
