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
# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Run FastAPI backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be active at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Dashboard will open at `http://localhost:5173`.

### 3. Run Automated Tests

```bash
source venv/bin/activate
pytest backend/tests/test_api.py -v
```

---

## 🔒 Security & Privacy

- All API credentials remain strictly server-side in `backend/.env`.
- Webhook endpoints require `x-omi-secret` authentication tokens.
- Vector searches apply tenant and user-level isolation filters.

---

## 📄 License
MIT License. Built for NEXUS AI Multi-Agent Orchestration.
