# Medical Communications & Scheduling Assistant

AI-powered assistant for managing patient communications, appointment scheduling, and clinical coordination.

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.12 + FastAPI |
| Frontend | React 18 + TypeScript + Vite |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # Config, security, dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   └── services/     # Business logic
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Helpers and API client
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml
└── docs/                 # Architecture and API docs
```

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

## Quick Start

### With Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

### Local backend development

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload
```

### Local frontend development

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing secret (generate with `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | Claude API key for AI features |

## Running Tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

## CI/CD

Pull requests trigger:
1. Backend linting (ruff) and tests (pytest)
2. Frontend linting (ESLint) and tests (Vitest)
3. Docker build verification

Merges to `main` deploy to the staging environment.
