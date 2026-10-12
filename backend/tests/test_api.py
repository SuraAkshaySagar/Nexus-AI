import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_api_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "backend" in data
    assert "qdrant" in data
    assert "lyzr" in data
    assert "omi" in data
    assert data["backend"]["status"] == "connected"

def test_list_agents():
    response = client.get("/api/v1/agents")
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) >= 5
    manager = next((a for a in agents if a["is_manager"]), None)
    assert manager is not None
    assert "Manager" in manager["role"]

def test_create_and_get_task():
    create_payload = {
        "prompt": "Investigate distributed consensus protocols for NEXUS multi-agent mesh",
        "category": "Research",
        "orchestration_mode": "manager_guided",
        "priority": "high"
    }
    create_res = client.post("/api/v1/tasks", json=create_payload)
    assert create_res.status_code == 200
    task = create_res.json()
    assert "id" in task
    assert task["prompt"] == create_payload["prompt"]

    task_id = task["id"]
    get_res = client.get(f"/api/v1/tasks/{task_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["id"] == task_id

def test_chat_endpoint():
    chat_payload = {
        "message": "Architect a fault-tolerant multi-agent topology with Qdrant vector memory",
        "category": "Architecture"
    }
    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert "response" in data
    assert len(data["agents_involved"]) >= 3
    assert data["status"] == "completed"

def test_memories_endpoints():
    # Store
    create_payload = {
        "text": "Byzantine fault tolerance requires 3f+1 nodes in consensus mesh",
        "topic": "Architecture",
        "source": "automated_test"
    }
    res = client.post("/api/memories", json=create_payload)
    assert res.status_code == 200
    mem = res.json()
    assert "memory_id" in mem
    assert mem["text"] == create_payload["text"]

    # Search
    search_res = client.get("/api/memories?q=Byzantine")
    assert search_res.status_code == 200
    results = search_res.json()
    assert isinstance(results, list)

def test_omi_webhooks():
    headers = {"x-omi-secret": "nexus_omi_webhook_secret_key"}
    conv_payload = {
        "id": "test-omi-conv-999",
        "structured": {
            "title": "Strategy Sync",
            "action_items": [{"description": "Deploy Lyzr Swarm"}]
        },
        "transcript": "Let us deploy the Lyzr Swarm and verify Qdrant."
    }
    conv_res = client.post("/omi/conversation", json=conv_payload, headers=headers)
    assert conv_res.status_code == 200
    assert conv_res.json()["status"] == "success"

    # Realtime chunk
    rt_res = client.post("/omi/realtime", json={"chunk": "audio_sample"}, headers=headers)
    assert rt_res.status_code == 200
    assert rt_res.json()["status"] == "received"
