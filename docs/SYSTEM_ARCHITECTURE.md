# TTS Content Studio — System Architecture

## Overview

```
                 +-------------+
                 |   Browser   |
                 +------+------+
                        |
            +-----------+-----------+
            |      FastAPI :8000    |
            |                       |
            |  /api/tts/*           |    +----------------------+
            |  /api/projects/*      |--->| kokoro-onnx engine   |
            |  /api/jobs/*          |    | Kokoro-82M (ONNX fp32)|
            |  /api/health /stats   |    | voices-v1.0.bin      |
            |                       |    +----------------------+
            |  serves frontend/dist |
            |  (built React SPA)    |    +----------------------+
            +-----------+-----------+--->| SQLite               |
                        |           |    | projects, jobs       |
                        |           |    +----------------------+
                        |           |
                        |           |    +----------------------+
                        |           +--->| storage/audio/*.wav  |
                        |                +----------------------+
            Development only:
            Vite dev server :5173 proxies /api -> :8000
```

- `kokoro_onnx.Kokoro.create()` is synchronous and CPU-bound; it runs via
  `asyncio.to_thread` so synthesis doesn't block the event loop.
- Jobs run on FastAPI `BackgroundTasks` (in-process queue; status/progress
  tracked in SQLite). Not persistent across restarts.
- `docs/SYSTEM_DIAGRAM.html` — interactive diagram of this architecture.
- `docs/ARQUITETURA_TTS_CPU.txt` — research blueprint for a future custom
  distilled model (Neuro-Wave Hx). Design study only; not implemented.

## Request flow

```
text -> POST /api/tts/synthesize -> Kokoro.create() [thread] -> wav file
                                                          -> {audio_url, duration}

POST /api/jobs/ -> job row (pending) -> background task -> completed + audio_url
```

## Deployment

Single container: `docker compose up -d --build`
The image builds the frontend, downloads the pinned model files
(`scripts/download_models.sh`, SHA-256 verified), installs `espeak-ng`, and
serves everything on port 8000. `docker-compose.yml` mounts `/app/data` for
the SQLite DB and generated audio.
