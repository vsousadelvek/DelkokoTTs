import kokoro_onnx
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional
from app.core.config import settings


class TTSEngine:
    _instance: Optional['TTSEngine'] = None

    VOICES = [
        "af_heart",
        "af_bella",
        "af_nicole",
        "af_sarah",
        "af_sky",
        "am_adam",
        "am_michael",
        "bf_emma",
        "bf_isabella",
        "bm_george",
        "bm_lewis"
    ]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.engine = None
            self.initialized = False

    async def initialize(self):
        if self.initialized:
            return

        model_path = settings.MODELS_DIR / "delkoko-v1.0.onnx"
        voices_path = settings.MODELS_DIR / "voices-v1.0.bin"

        if not model_path.exists() or not voices_path.exists():
            raise FileNotFoundError(
                f"TTS model files not found. Please download:\n"
                f"- {model_path}\n"
                f"- {voices_path}"
            )

        self.engine = kokoro_onnx.Kokoro(
            str(model_path),
            str(voices_path)
        )

        self.initialized = True
        print("=" * 60)
        print("DELkokoOtimized TTS Engine Initialized")
        print("=" * 60)

    def get_voices(self) -> List[Dict[str, str]]:
        return [
            {
                "id": voice,
                "name": self._format_voice_name(voice),
                "gender": "Female" if voice.startswith(("af_", "bf_")) else "Male",
                "accent": "American" if voice.startswith("a") else "British"
            }
            for voice in self.VOICES
        ]

    def _format_voice_name(self, voice_id: str) -> str:
        parts = voice_id.split("_")
        name = parts[1].capitalize()
        gender = "Female" if parts[0].startswith(("af", "bf")) else "Male"
        accent = "American" if parts[0].startswith("a") else "British"
        return f"{name} ({gender}, {accent})"

    async def synthesize(
        self,
        text: str,
        voice: str = "af_bella",
        speed: float = 1.0,
        output_path: Optional[Path] = None
    ) -> tuple[Path, float]:
        if not self.initialized:
            await self.initialize()

        if voice not in self.VOICES:
            raise ValueError(f"Voice '{voice}' not found. Available: {self.VOICES}")

        # Clamp speed between 0.5 and 2.0
        speed = max(0.5, min(2.0, speed))

        # Generate audio
        samples, sample_rate = self.engine.create(
            text,
            voice=voice,
            speed=speed,
            lang="en-us"
        )

        # Calculate duration
        duration = len(samples) / sample_rate

        # Save audio
        if output_path is None:
            import uuid
            filename = f"{uuid.uuid4().hex}.wav"
            output_path = settings.AUDIO_DIR / filename

        sf.write(str(output_path), samples, sample_rate)

        return output_path, duration


# Global instance
tts_engine = TTSEngine()
