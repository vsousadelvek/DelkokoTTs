from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.database import get_db
from app.models.job import Job
from app.core.tts_engine import tts_engine

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


class JobCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    voice: str = Field(default="af_bella")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class JobResponse(BaseModel):
    id: int
    text: str
    voice: str
    speed: float
    status: str
    progress: float
    audio_url: Optional[str]
    duration: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


async def process_job(job_id: int, text: str, voice: str, speed: float):
    from app.models.database import async_session_maker

    async with async_session_maker() as db:
        try:
            # Update status to processing
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()

            if not job:
                return

            job.status = "processing"
            job.progress = 0.1
            await db.commit()

            # Synthesize audio
            output_path, duration = await tts_engine.synthesize(
                text=text,
                voice=voice,
                speed=speed
            )

            filename = output_path.name
            audio_url = f"/api/tts/audio/{filename}"

            # Update job as completed
            job.status = "completed"
            job.progress = 1.0
            job.audio_url = audio_url
            job.duration = duration
            await db.commit()

        except Exception as e:
            # Update job as failed
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()

            if job:
                job.status = "failed"
                job.progress = 0.0
                await db.commit()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_create: JobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    db_job = Job(
        text=job_create.text,
        voice=job_create.voice,
        speed=job_create.speed,
        status="pending",
        progress=0.0
    )

    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)

    # Start background processing
    background_tasks.add_task(
        process_job,
        db_job.id,
        job_create.text,
        job_create.voice,
        job_create.speed
    )

    return db_job


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Job).order_by(Job.created_at.desc())

    if status:
        query = query.where(Job.status == status)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.execute(delete(Job).where(Job.id == job_id))
    await db.commit()

    return {"message": "Job deleted successfully"}


@router.post("/{job_id}/retry", response_model=JobResponse)
async def retry_job(
    job_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in ["failed", "completed"]:
        raise HTTPException(status_code=400, detail="Job cannot be retried")

    job.status = "pending"
    job.progress = 0.0
    job.audio_url = None
    job.duration = None

    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(
        process_job,
        job.id,
        job.text,
        job.voice,
        job.speed
    )

    return job
