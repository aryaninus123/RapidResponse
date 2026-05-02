# RapidRespond

A multi-agent, voice-activated emergency response system that transforms unstructured, multilingual voice input into real-time coordinated action.

## Features

- **Voice Recognition** — Whisper AI for high-accuracy voice transcription
- **Multilingual Support** — Google Cloud Translation for non-English input
- **Emergency Classification** — Fine-tuned BERT model to classify emergency type and priority
- **Real-time Data Collection** — Apify integration for contextual situational data
- **Intelligent Routing** — Automatically dispatches to appropriate emergency services
- **Traffic & Weather Awareness** — Factors in real-time conditions for response planning
- **Live Updates** — WebSocket-based real-time notifications to all stakeholders
- **Web Dashboard** — Next.js frontend for monitoring and managing emergencies

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis (optional — used for caching; app runs without it)

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd RapidResponse
```

### 2. Set up the backend

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` — at minimum you need `DATABASE_URL`. The Google Cloud and Apify keys are only required if you want translation and data collection to work. See [Optional Services](#optional-services) below.

### 3. Set up the database

Make sure PostgreSQL is running, then create the database and initialize the schema:

```bash
# Create database
psql postgres -c "CREATE DATABASE rapidrespond;"

# Initialize schema
python scripts/init_db.py
```

The default `DATABASE_URL` in `.env.example` assumes a local PostgreSQL instance with user `postgres` and password `postgres`. Adjust as needed.

### 4. Start the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 5. Set up the frontend

```bash
cd frontend-web

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.example .env.local
```

Edit `frontend-web/.env.local`. The `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` default to `localhost:8000` and should work without changes. Add a Google Maps API key if you want map features.

### 6. Start the frontend

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Optional Services

These services are optional — the app starts without them but those features will be degraded or disabled.

| Service | Env Var | Used For |
|---|---|---|
| Google Cloud Translation | `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` | Translating non-English emergency reports |
| Apify | `APIFY_API_TOKEN` | Real-time contextual data collection |
| Redis | `REDIS_URL` | Caching and real-time features |
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map display in the web dashboard |

For Google Cloud Translation, place your service account JSON file at `credentials/google-cloud-credentials.json` (or update the path in `.env`).

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/emergency/new` | Submit a new emergency |
| GET | `/emergency/{id}` | Get a specific emergency |
| PUT | `/emergency/{id}/update` | Update emergency details |
| GET | `/emergency/history` | List historical emergencies |
| GET | `/emergency/stats` | Analytics and statistics |
| GET | `/services/status` | Service health status |
| GET | `/health` | Backend health check |

## Architecture

```
frontend-web/        Next.js dashboard (port 3000)
main.py              FastAPI application (port 8000)
database/            SQLAlchemy models and DB connection
services/
  auth/              JWT authentication
  classification/    BERT-based emergency classifier
  translation/       Google Cloud Translation integration
  data_collection/   Apify data collection
  notifications/     Email/real-time notifications
migrations/          Alembic database migrations
scripts/             Utility scripts (DB init, data population)
models/              ML model files
```
