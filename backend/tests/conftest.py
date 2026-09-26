import os
import tempfile

# Isolate the SQLite DB and audio output before app modules import settings
_tmp = tempfile.mkdtemp(prefix="tts-test-")
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_tmp}/test.db")
os.environ.setdefault("AUDIO_DIR", _tmp)
