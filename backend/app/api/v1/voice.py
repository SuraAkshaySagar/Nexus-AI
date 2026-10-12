import json
import uuid
from typing import List, Dict, Any, Optional
from backend.app.core.utils import utc_now_iso
from fastapi import APIRouter, HTTPException, Header, Request, BackgroundTasks, Query

from backend.app.schemas.voice import VoiceConversationResponse, VoiceExecuteRequest
from backend.app.integrations.omi import omi_service
from backend.app.core.database import get_connection
from backend.app.services.task_service import task_service
from backend.app.services.orchestrator import orchestrator

router = APIRouter(tags=["Voice & Omi"])

# Webhook ingestion endpoints under /api/v1/integrations/omi/
@router.post("/integrations/omi/conversation")
async def omi_conversation_webhook(
    request: Request,
    x_omi_secret: Optional[str] = Header(None)
):
    body = await request.json()
    if not omi_service.verify_webhook(x_omi_secret):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Omi webhook secret")

    parsed = omi_service.parse_payload(body)
    now = utc_now_iso()

    # Deduplication check: check if an event with this ID or transcript exists
    incoming_id = str(body.get("id") or body.get("session_id") or "")
    with get_connection() as conn:
        cursor = conn.cursor()
        if incoming_id:
            cursor.execute("SELECT id FROM voice_conversations WHERE id = ?;", (incoming_id,))
            existing = cursor.fetchone()
            if existing:
                return {
                    "status": "success",
                    "conversation_id": existing["id"],
                    "title": parsed["title"],
                    "action_items_count": len(parsed["action_items"]),
                    "extracted_tasks": parsed["extracted_tasks"],
                    "deduplicated": True
                }

        conv_id = incoming_id if incoming_id else str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO voice_conversations (id, title, source, transcript, speakers, action_items, extracted_tasks, associated_task_id, raw_payload, created_at)
        VALUES (?, ?, 'omi_webhook', ?, ?, ?, ?, NULL, ?, ?);
        """, (
            conv_id,
            parsed["title"],
            parsed["transcript"],
            json.dumps(parsed["speakers"]),
            json.dumps(parsed["action_items"]),
            json.dumps(parsed["extracted_tasks"]),
            json.dumps(parsed["raw_payload"]),
            now
        ))
        conn.commit()

    return {
        "status": "success",
        "conversation_id": conv_id,
        "title": parsed["title"],
        "action_items_count": len(parsed["action_items"]),
        "extracted_tasks": parsed["extracted_tasks"],
        "deduplicated": False
    }

@router.post("/integrations/omi/realtime")
async def omi_realtime_webhook(
    request: Request,
    x_omi_secret: Optional[str] = Header(None)
):
    body = await request.json()
    if not omi_service.verify_webhook(x_omi_secret):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Fast acknowledgment without triggering heavy workflow on partial chunks
    return {"status": "received", "timestamp": utc_now_iso()}

# Voice intelligence endpoints under /api/v1/voice/
@router.get("/voice/conversations", response_model=List[VoiceConversationResponse])
def list_voice_conversations(limit: int = 20, offset: int = 0):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM voice_conversations ORDER BY created_at DESC LIMIT ? OFFSET ?;", (limit, offset))
        rows = cursor.fetchall()
        output = []
        for r in rows:
            item = dict(r)
            item["speakers"] = json.loads(item["speakers"])
            item["action_items"] = json.loads(item["action_items"])
            item["extracted_tasks"] = json.loads(item["extracted_tasks"])
            output.append(item)
        return output

@router.post("/voice/conversations/{conversation_id}/execute")
async def execute_voice_task(
    conversation_id: str,
    body: VoiceExecuteRequest,
    background_tasks: BackgroundTasks
):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM voice_conversations WHERE id = ?;", (conversation_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Voice conversation not found")
        conv = dict(row)

    extracted_tasks = json.loads(conv["extracted_tasks"])
    prompt = f"Execute action plan derived from Omi voice conversation '{conv['title']}':\n\n"
    if extracted_tasks:
        prompt += "\n".join([f"- {t}" for t in extracted_tasks])
    else:
        prompt += conv["transcript"]

    task = task_service.create_task(
        prompt=prompt,
        title=f"Voice: {conv['title']}",
        category=body.category,
        priority=body.priority,
        source="omi_voice"
    )

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE voice_conversations SET associated_task_id = ? WHERE id = ?;", (task["id"], conversation_id))
        conn.commit()

    background_tasks.add_task(
        orchestrator.run_orchestration,
        task_id=task["id"],
        save_to_memory=body.save_to_memory
    )

    return {
        "conversation_id": conversation_id,
        "task_id": task["id"],
        "status": "orchestrating",
        "task": task
    }
