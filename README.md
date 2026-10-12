# NEXUS AI — 3D Collaborative Multi-Agent Orchestration System

![NEXUS AI Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

**NEXUS AI** is an intelligent multi-agent orchestration platform where a **Lyzr Manager Agent** coordinates specialized AI agents to complete complex user requests with **Qdrant Cloud vector memory** and **Omi voice intelligence**.

---

## ⚡ Core Multi-Agent Workflow

```
USER INPUT / OMI VOICE 
  → BACKEND GATEWAY 
  → QDRANT SEMANTIC MEMORY RETRIEVAL 
  → LYZR MANAGER AGENT 
  → SPECIALIST SWARM (Research, Architecture, Planning) 
  → QUALITY REVIEW & AUDIT 
  → CONSOLIDATED ANSWER & MEMORY STORAGE 
  → 3D DASHBOARD TELEMETRY
```

---

## 🌟 Key Features

1. **Interactive 3D Agent Network Topology**:
   - Central Manager Agent node surrounded by specialist agent nodes built with **Three.js** and **React Three Fiber**.
   - Dynamic animated light pulses along connections reflecting real in-flight task progress.
   - Distinct visual node states: `idle`, `running`, `completed`, `failed`, and `waiting`.
   - Floating particle field with depth, GPU-conscious controls, camera reset, and a **2D fallback view**.

2. **Lyzr Manager Orchestration**:
   - Decomposes high-level mission goals into domain-specific sub-goals.
   - Delegates work across configured specialist agents:
     - **NEXUS Deep Researcher** (Factual synthesis & background investigation)
     - **NEXUS Technical Architect** (System topology & latency trade-offs)
     - **NEXUS Strategic Planner** (Roadmaps & execution sequencing)
     - **NEXUS Quality Reviewer** (Hallucination audit & constraint validation)

3. **Qdrant Shared Vector Memory**:
   - Live integration with Qdrant Cloud cluster (`nexus_memory` collection, 384D Cosine metric).
   - Fast semantic vector search, category filtering, manual knowledge ingestion, and deletion controls.
   - Automatically stores approved task syntheses into shared vector space for future recall.

4. **Omi Voice Intelligence Integration**:
   - Authenticated webhook listener (`POST /api/v1/integrations/omi/conversation`).
   - Defensively parses conversations, attributes speakers, and extracts actionable tasks.
   - **1-Click Execution**: Convert any voice conversation into a multi-agent orchestration run directly from the UI.

5. **Live Execution Stream (SSE)**:
   - Real-time Server-Sent Events stream (`/api/v1/tasks/{id}/events`).
   - Step-by-step progress timeline, individual agent input/output cards, and consolidated final reports.

6. **Full Telemetry & History**:
   - Searchable execution history with JSON and Markdown export.
   - Recharts analytics dashboard with daily task volume, pass rates, and specialist workload distribution.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Three.js, React Three Fiber, Framer Motion, Recharts, Lucide Icons, React Router |
| **Backend** | Python 3.11+, FastAPI, Pydantic, HTTPX, SQLite WAL mode, Server-Sent Events (SSE) |
| **Integrations** | Lyzr Agent Studio, Qdrant Cloud Client, FastEmbed (384D BAAI/bge-small-en-v1.5), Omi Webhooks |
| **DevOps** | Docker, Docker Compose |

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
# Option A: From backend folder (Recommended)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app:app --reload --port 8000

# Option B: From project root
source venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be operational at `http://localhost:8000` (Swagger UI at `http://localhost:8000/docs`).

### 2. Frontend Setup

In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```

Dashboard will open at `http://localhost:5173`.

### 3. Exposing for Omi Webhooks (ngrok)

```bash
ngrok http 8000
```
In Omi Developer Mode, configure:
- **Webhook URL**: `https://<your-ngrok-subdomain>.ngrok-free.app/omi/conversation`
- **Secret Header**: `x-omi-secret: nexus_omi_webhook_secret_key`

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Core system health check |
| `GET` | `/api/status` | Verified service status (Backend, Lyzr, Qdrant, Omi) |
| `POST` | `/api/chat` | Direct multi-agent swarm chat with Qdrant retrieval |
| `GET` | `/api/memories` | Semantic vector search in Qdrant cluster |
| `POST` | `/api/memories` | Store knowledge point into Qdrant |
| `POST` | `/omi/conversation` | Omi conversation transcript webhook |
| `POST` | `/omi/realtime` | Omi realtime audio stream webhook |
| `GET` | `/api/v1/tasks/{id}/events` | Live SSE execution stream |

---

## 🧪 Run Automated Tests

```bash
# From project root:
source venv/bin/activate
pytest backend/tests/test_api.py -v
```
