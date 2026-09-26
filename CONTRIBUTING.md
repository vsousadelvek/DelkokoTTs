# Contributing

Thanks for your interest in contributing to TTS Content Studio.

## Development setup

See the README for backend (`backend/`) and frontend (`frontend/`) setup.

## Before opening a PR

- `cd backend && pip install -r requirements-dev.txt && python -m pytest tests/` — tests must pass
- `cd frontend && npm run build` — TypeScript must compile cleanly
- Keep changes focused; describe the problem and the approach in the PR

## Code style

- Backend: standard FastAPI/Pydantic patterns, async SQLAlchemy
- Frontend: TypeScript strict mode, shadcn/ui components, Tailwind classes
- UI copy is in pt-BR; code, comments and docs in English

## Reporting issues

Open a GitHub issue with reproduction steps. For synthesis bugs, include the
input text, voice, speed, and the backend logs.
