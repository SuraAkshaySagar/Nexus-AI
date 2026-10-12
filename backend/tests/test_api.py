import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_list_agents():
    response = client.get("/api/v1/agents")
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) >= 5
    # Verify Manager agent exists
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
    assert task["status"] in ("pending", "retrieving_memory", "planning", "executing", "completed")

    task_id = task["id"]
    get_res = client.get(f"/api/v1/tasks/{task_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["id"] == task_id

def test_integrations_status():
    response = client.get("/api/v1/integrations/status")
    assert response.status_code == 200
    data = response.json()
    assert "backend" in data
    assert "qdrant" in data
    assert "lyzr" in data
    assert "omi" in data
    assert data["backend"]["status"] == "connected"

def test_memory_stats():
    response = client.get("/api/v1/memory/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "collection_name" in stats
