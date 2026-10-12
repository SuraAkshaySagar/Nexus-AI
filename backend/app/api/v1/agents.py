import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException

from backend.app.schemas.agents import (
    AgentResponse, AgentRegisterRequest, AgentUpdateRequest, AgentTestResponse
)
from backend.app.core.database import get_connection
from backend.app.integrations.lyzr import lyzr_service

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("", response_model=List[AgentResponse])
def list_agents():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents ORDER BY is_manager DESC, created_at ASC;")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.post("/register", response_model=AgentResponse)
def register_agent(data: AgentRegisterRequest):
    agent_id = f"custom-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO agents (id, name, role, description, lyzr_agent_id, is_manager, enabled, status, total_executions, successful_executions, failed_executions, avg_response_time_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'idle', 0, 0, 0, 0.0, ?);
        """, (agent_id, data.name, data.role, data.description, data.lyzr_agent_id, 1 if data.is_manager else 0, 1 if data.enabled else 0, now))
        conn.commit()

        cursor.execute("SELECT * FROM agents WHERE id = ?;", (agent_id,))
        row = cursor.fetchone()
        return dict(row)

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: str, data: AgentUpdateRequest):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?;", (agent_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Agent not found")

        fields = []
        params = []
        if data.name is not None:
            fields.append("name = ?")
            params.append(data.name)
        if data.role is not None:
            fields.append("role = ?")
            params.append(data.role)
        if data.description is not None:
            fields.append("description = ?")
            params.append(data.description)
        if data.lyzr_agent_id is not None:
            fields.append("lyzr_agent_id = ?")
            params.append(data.lyzr_agent_id)
        if data.enabled is not None:
            fields.append("enabled = ?")
            params.append(1 if data.enabled else 0)

        if fields:
            params.append(agent_id)
            cursor.execute(f"UPDATE agents SET {', '.join(fields)} WHERE id = ?;", params)
            conn.commit()

        cursor.execute("SELECT * FROM agents WHERE id = ?;", (agent_id,))
        return dict(cursor.fetchone())

@router.post("/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent_connection(agent_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?;", (agent_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent = dict(row)

    target_lyzr_id = agent.get("lyzr_agent_id") or lyzr_service.manager_agent_id
    if not target_lyzr_id:
        return AgentTestResponse(
            agent_id=agent_id,
            agent_name=agent["name"],
            success=False,
            status="not_configured",
            message="No Lyzr Agent ID associated with this agent card.",
            response_time_ms=0.0
        )

    result = await lyzr_service.test_agent(target_lyzr_id)
    return AgentTestResponse(
        agent_id=agent_id,
        agent_name=agent["name"],
        success=result["success"],
        status=result["status"],
        message=result["message"],
        response_time_ms=result["response_time_ms"],
        raw_response=result.get("raw_response")
    )
