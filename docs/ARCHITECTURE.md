# NEXUS AI — System Architecture & Multi-Agent Swarm Topology

NEXUS AI is a production-grade, collaborative multi-agent orchestration dashboard. A central **Lyzr Manager Agent** decomposes user objectives, extracts context from **Qdrant Shared Vector Memory**, delegates specialized micro-tasks across autonomous specialist nodes, and enforces quality verification before delivering consolidated reports.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client Layer
        UI["React 19 + TypeScript + Tailwind CSS"]
        ThreeCanvas["Three.js 3D Interactive Topology"]
        SSEListener["SSE Real-time Event Listener"]
    end

    subgraph API & Gateway Layer
        FastAPI["FastAPI 0.115+ Core Engine"]
        EventBus["Asyncio In-Memory EventBus"]
        DB[(SQLite WAL Persistence)]
    end

    subgraph Memory & External Intelligence
        Qdrant[("Qdrant Cloud Vector Cluster\n(nexus_memory, 384D)")]
        FastEmbed["FastEmbed / Embedding Generator"]
        Omi["Omi Wearable / Voice Webhooks"]
    end

    subgraph Swarm Execution Pipeline
        Manager["NEXUS Orchestration Manager (Lyzr)"]
        Researcher["NEXUS Deep Researcher"]
        Architect["NEXUS Technical Architect"]
        Planner["NEXUS Strategic Planner"]
        Reviewer["NEXUS Quality Reviewer"]
    end

    UI -->|HTTP POST Task| FastAPI
    Omi -->|Webhook POST /conversation| FastAPI
    FastAPI -->|Store & Retrieve History| DB
    FastAPI -->|Query Semantics| Qdrant
    FastEmbed -.->|384D Cosine Vectors| Qdrant

    FastAPI -->|Initiate Pipeline| Manager
    Manager --> Researcher
    Manager --> Architect
    Manager --> Planner
    Researcher & Architect & Planner --> Reviewer
    Reviewer -->|Verified Report| Manager

    Manager -->|Final Report Saved| Qdrant
    FastAPI -->|Broadcast Progress| EventBus
    EventBus -->|Server-Sent Events /stream| SSEListener
    SSEListener --> UI
    SSEListener --> ThreeCanvas
```

---

## 2. Core Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Dashboard / Omi Voice
    participant Backend as FastAPI Server
    participant Memory as Qdrant Vector Memory
    participant Manager as Lyzr Manager Agent
    participant Specialists as Specialist Swarm
    participant Reviewer as Quality Reviewer
    participant Client as 3D Dashboard UI

    User->>Backend: Submit Task Objective (Prompt, Category, Priority)
    Backend->>Client: Emit "task_started" (SSE)
    Backend->>Memory: Semantic Search (Query Embedding, Top 4 Vectors)
    Memory-->>Backend: Matched Context & Relevance Scores
    Backend->>Client: Emit "memory_retrieved" (Pulsing connection)
    Backend->>Manager: Delegate with Memory Context
    Manager->>Specialists: Route Domain Tasks (Research, Architecture, Planning)
    Specialists->>Backend: Specialist Analysis & Specifications
    Backend->>Client: Emit "agent_output" (Real-time telemetry)
    Backend->>Reviewer: Verify Constraints & Hallucination Audit
    Reviewer-->>Backend: Audit Passed (99%+ Confidence)
    Backend->>Memory: Upsert Verified Synthesis to Qdrant
    Backend->>Client: Deliver Final Consolidated Output & "task_completed"
```

---

## 3. Data Storage Topologies

1. **Relational State (SQLite WAL Mode `nexus_data.db`)**:
   - `tasks`: Full metadata, execution mode, prompts, durations, assigned agents, final outputs.
   - `task_events`: Event sourcing audit log (agent names, timestamps, statuses, JSON payloads).
   - `agents`: Registered Lyzr Agent IDs, availability, total invocations, average latencies.
   - `voice_conversations`: Ingested Omi transcripts, speakers, extracted action items.

2. **Vector Space (Qdrant Cloud `nexus_memory`)**:
   - Vector dimension: `384`
   - Distance metric: `Cosine`
   - Payload schema: `memory_id`, `text`, `user_id`, `task_id`, `topic`, `source`, `created_at`, `metadata`.
