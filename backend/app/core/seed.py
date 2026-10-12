import json
from backend.app.core.database import get_connection
from backend.app.core.utils import utc_now_iso

def seed_demo_data():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM tasks;")
        task_count = cursor.fetchone()["count"]

        if task_count == 0:
            task_id = "nexus-demo-task-001"
            now = utc_now_iso()
            cursor.execute("""
            INSERT INTO tasks (id, title, prompt, category, orchestration_mode, priority, source, status, assigned_agents, memory_references, final_result, error_message, duration_seconds, created_at, updated_at, completed_at)
            VALUES (?, ?, ?, 'Architecture', 'manager_guided', 'high', 'dashboard', 'completed', ?, ?, ?, '', 3.42, ?, ?, ?);
            """, (
                task_id,
                "Architecting Low-Latency Consensus for NEXUS Swarm",
                "Design a distributed coordination protocol for decentralized multi-agent synchronization with sub-10ms latency.",
                json.dumps(["NEXUS Orchestration Manager", "NEXUS Technical Architect", "NEXUS Deep Researcher", "NEXUS Quality Reviewer"]),
                json.dumps([{"memory_id": "mem-seed-1", "topic": "Architecture", "text": "Previous benchmark showed Raft protocol achieves 8.2ms latency on 5-node cluster.", "score": 0.89}]),
                """# NEXUS Multi-Agent Execution Report

**Task**: Design a distributed coordination protocol for decentralized multi-agent synchronization with sub-10ms latency.
**Orchestration Mode**: manager_guided

### NEXUS Technical Architect Blueprint
- **Topology**: Asynchronous Gossip-based mesh with monotonic logical clocks.
- **State Guarantee**: Eventual consistency with bounded vector clocks.
- **Latency Target**: 4.1ms average traversal across 12 connected agent peers.

### NEXUS Deep Researcher Analysis
- **Benchmark Findings**: Evaluated CRDT vs Raft consensus. CRDT state replication demonstrates zero-lock concurrency.
- **Failure Recovery**: Node churn tolerated up to 33% Byzantine failure rates without state divergence.

### Quality & Verification Audit
**Verification Passed**: Conforms to real-time agent SLA requirements. Zero race conditions detected in protocol simulation.""",
                now, now, now
            ))

            # Seed demo voice note
            cursor.execute("SELECT COUNT(*) as count FROM voice_conversations;")
            if cursor.fetchone()["count"] == 0:
                conv_id = "omi-demo-conv-001"
                cursor.execute("""
                INSERT INTO voice_conversations (id, title, source, transcript, speakers, action_items, extracted_tasks, associated_task_id, raw_payload, created_at)
                VALUES (?, ?, 'omi_webhook', ?, ?, ?, ?, ?, '{}', ?);
                """, (
                    conv_id,
                    "Voice Note: AI Mesh Architecture Strategy",
                    "Akshay: We need to build the NEXUS multi-agent orchestration engine. Ensure the 3D network reflects live agent states, connects to Qdrant Cloud for vector memory, and supports Omi voice webhooks.\nManager: Understood. Let's make sure the Lyzr Manager orchestrates the specialists and all telemetry flows in real-time.",
                    json.dumps(["Akshay", "Manager"]),
                    json.dumps([
                        "Build NEXUS multi-agent orchestration engine",
                        "Connect 3D agent network to real execution telemetry",
                        "Integrate Qdrant Cloud vector memory",
                        "Support Omi voice webhooks and 1-click execution"
                    ]),
                    json.dumps([
                        "Implement real-time multi-agent execution pipeline",
                        "Verify Qdrant Cloud cluster vector storage",
                        "Enable Omi voice webhook task conversion"
                    ]),
                    task_id,
                    now
                ))

            conn.commit()

seed_demo_data()
