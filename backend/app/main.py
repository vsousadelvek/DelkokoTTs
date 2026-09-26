from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.tts_engine import tts_engine
from app.models.database import init_db
from app.api.routes import tts, projects, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize database
    await init_db()
    print("Database initialized")

    # Initialize TTS engine
    try:
        await tts_engine.initialize()
    except FileNotFoundError as e:
        print(f"Warning: {e}")
        print("TTS engine will initialize on first request")

    yield

    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tts.router)
app.include_router(projects.router)
app.include_router(jobs.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "tts_engine": tts_engine.initialized,
        "voices_available": len(tts_engine.VOICES)
    }


@app.get("/api/stats")
async def get_stats():
    from app.models.database import async_session_maker
    from app.models.project import Project
    from app.models.job import Job
    from sqlalchemy import select, func

    async with async_session_maker() as db:
        # Count projects
        result = await db.execute(select(func.count(Project.id)))
        total_projects = result.scalar()

        # Count jobs by status
        result = await db.execute(
            select(Job.status, func.count(Job.id))
            .group_by(Job.status)
        )
        jobs_by_status = dict(result.all())

        # Total jobs
        total_jobs = sum(jobs_by_status.values())

        return {
            "projects": {
                "total": total_projects
            },
            "jobs": {
                "total": total_jobs,
                "by_status": jobs_by_status
            },
            "tts": {
                "engine": "kokoro-82m (onnx)",
                "voices": len(tts_engine.VOICES),
                "initialized": tts_engine.initialized
            }
        }


# Serve the built frontend (frontend/dist) when present — production/Docker.
# API routes are registered above, so this catch-all only handles client paths.
FRONTEND_DIST = settings.BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        candidate = (FRONTEND_DIST / full_path).resolve()
        if full_path and candidate.is_file() and FRONTEND_DIST.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
