# NEXUS AI — Local Setup & Deployment Guide

This guide walks through configuring and running the complete NEXUS AI system locally or in containerized environments.

---

## 1. Prerequisites

- **Python**: 3.11+ (Python 3.12+ recommended)
- **Node.js**: v18+ or v20+
- **npm**: v9+
- Optional: Docker & Docker Compose

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` inside `backend/`:

```bash
cp backend/.env.example backend/.env
```

Set the following variables inside `backend/.env`:

```env
# Lyzr Agent Studio Credentials
LYZR_API_KEY=your_lyzr_api_key_here
LYZR_AGENT_ID=nexus-manager
LYZR_BASE_URL=https://agent-prod.lyzr.ai

# Qdrant Vector Cluster
QDRANT_URL=https://d99af7c1-3fa8-40d0-84c3-8212924e8fe6.eu-west-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=nexus_memory

# Omi Voice Integration Secret
OMI_WEBHOOK_SECRET=nexus_omi_webhook_secret_key

# Core Server Settings
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=sqlite:///./nexus_data.db
APP_ENV=development
PORT=8000
HOST=0.0.0.0
```

---

## 3. Running Locally

### Step 1: Start the Backend (FastAPI)

```bash
# In project root:
source venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be operational at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### Step 2: Start the Frontend (Vite)

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

The dashboard will open at `http://localhost:5173`.

---

## 4. Running Backend Tests

```bash
source venv/bin/activate
pytest backend/tests/test_api.py -v
```

---

## 5. Docker Deployment

To spin up both frontend and backend using Docker Compose:

```bash
docker-compose up --build
```
