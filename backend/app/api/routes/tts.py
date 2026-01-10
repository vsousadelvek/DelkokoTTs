from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional
from pathlib import Path
from app.core.tts_engine import tts_engine
from app.core.config import settings

router = APIRouter(prefix="/api/tts", tags=["TTS"])


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    voice: str = Field(default="af_bella")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class SynthesizeResponse(BaseModel):
    audio_url: str
    duration: float
    filename: str


@router.get("/voices")
async def get_voices():
    return {
        "voices": tts_engine.get_voices(),
        "count": len(tts_engine.VOICES)
    }


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_audio(request: SynthesizeRequest):
    try:
        output_path, duration = await tts_engine.synthesize(
            text=request.text,
            voice=request.voice,
            speed=request.speed
        )

        filename = output_path.name
        audio_url = f"/api/tts/audio/{filename}"

        return SynthesizeResponse(
            audio_url=audio_url,
            duration=duration,
            filename=filename
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")


@router.post("/preview", response_model=SynthesizeResponse)
async def preview_audio(request: SynthesizeRequest):
    try:
        # Limit preview to first 500 characters
        preview_text = request.text[:500]

        output_path, duration = await tts_engine.synthesize(
            text=preview_text,
            voice=request.voice,
            speed=request.speed
        )

        filename = output_path.name
        audio_url = f"/api/tts/audio/{filename}"

        return SynthesizeResponse(
            audio_url=audio_url,
            duration=duration,
            filename=filename
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    audio_path = settings.AUDIO_DIR / filename

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Security check: ensure file is within AUDIO_DIR
    try:
        audio_path.resolve().relative_to(settings.AUDIO_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/wav",
        filename=filename
    )
