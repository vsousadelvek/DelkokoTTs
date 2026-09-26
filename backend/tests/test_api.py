"""API tests — run without the ONNX model by stubbing the TTS engine."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.tts_engine import tts_engine
from app.main import app


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    # ASGITransport does not run the lifespan hook — create tables manually
    from app.models.database import init_db
    await init_db()

    # Point generated audio at a temp dir and stub out model loading/synthesis
    from app.core.config import settings
    monkeypatch.setattr(settings, "AUDIO_DIR", tmp_path)

    async def fake_synthesize(text, voice="af_bella", speed=1.0, output_path=None):
        from pathlib import Path
        import uuid
        out = Path(output_path or tmp_path / f"{uuid.uuid4().hex}.wav")
        # minimal valid-ish wav bytes for tests (not played back)
        out.write_bytes(b"RIFF" + b"\x00" * 40)
        return out, 1.0

    monkeypatch.setattr(tts_engine, "synthesize", fake_synthesize)
    monkeypatch.setattr(tts_engine, "initialized", True)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"
    assert body["voices_available"] == len(tts_engine.VOICES)


@pytest.mark.asyncio
async def test_voices(client):
    r = await client.get("/api/tts/voices")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == len(tts_engine.VOICES)
    assert all(v["id"] in tts_engine.VOICES for v in body["voices"])


@pytest.mark.asyncio
async def test_synthesize_and_download(client):
    r = await client.post("/api/tts/synthesize", json={
        "text": "Hello world",
        "voice": "af_bella",
        "speed": 1.0,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["audio_url"].startswith("/api/tts/audio/")
    assert body["duration"] == 1.0

    audio = await client.get(body["audio_url"])
    assert audio.status_code == 200
    assert audio.headers["content-type"] == "audio/wav"


@pytest.mark.asyncio
async def test_synthesize_validation(client):
    r = await client.post("/api/tts/synthesize", json={"text": ""})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_project_crud(client):
    r = await client.post("/api/projects/", json={
        "name": "test project",
        "text_content": "one two three",
        "voice": "af_bella",
    })
    assert r.status_code == 200
    project = r.json()
    assert project["word_count"] == 3

    pid = project["id"]
    assert (await client.get(f"/api/projects/{pid}")).status_code == 200

    r = await client.put(f"/api/projects/{pid}", json={"name": "renamed"})
    assert r.status_code == 200
    assert r.json()["name"] == "renamed"

    assert (await client.delete(f"/api/projects/{pid}")).status_code == 200
    assert (await client.get(f"/api/projects/{pid}")).status_code == 404


@pytest.mark.asyncio
async def test_job_lifecycle(client):
    r = await client.post("/api/jobs/", json={
        "text": "job test",
        "voice": "am_adam",
    })
    assert r.status_code == 200
    job = r.json()
    assert job["status"] in ("pending", "processing", "completed")

    r = await client.get(f"/api/jobs/{job['id']}")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_audio_path_traversal_blocked(client):
    r = await client.get("/api/tts/audio/..%2F..%2Fetc%2Fpasswd")
    assert r.status_code in (403, 404)
