import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse

from backend.app.schemas.tasks import (
    TaskCreate, TaskResponse, TaskDetailResponse, TaskEventResponse
)
from backend.app.services.task_service import task_service
from backend.app.services.orchestrator import orchestrator
from backend.app.core.events import event_bus

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=TaskResponse)
async def create_task(data: TaskCreate, background_tasks: BackgroundTasks):
    task = task_service.create_task(
        prompt=data.prompt,
        title=data.title,
        category=data.category,
        orchestration_mode=data.orchestration_mode,
        priority=data.priority,
        source=data.source
    )
    
    # Launch multi-agent pipeline asynchronously in the background
    background_tasks.add_task(
        orchestrator.run_orchestration,
        task_id=task["id"],
        user_id=data.user_id or "default_user",
        save_to_memory=data.save_to_memory
    )
    
    return task

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = 0
):
    return task_service.list_tasks(status=status, category=category, search=search, limit=limit, offset=offset)

@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task_details(task_id: str):
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    events = task_service.get_events(task_id)
    task["events"] = events
    return task

@router.get("/{task_id}/events")
async def stream_task_events(task_id: str):
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        # First send existing recorded events
        existing_events = task_service.get_events(task_id)
        for ev in existing_events:
            yield f"data: {json.dumps(ev)}\n\n"

        # If already completed or failed, close stream
        if task["status"] in ("completed", "failed", "cancelled"):
            yield f"data: {json.dumps({'event_type': 'stream_end', 'task_id': task_id})}\n\n"
            return

        # Subscribe to real-time events queue
        queue = await event_bus.subscribe(task_id)
        try:
            while True:
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                    if event_data.get("event_type") in ("final_answer_delivered", "error", "task_completed"):
                        yield f"data: {json.dumps({'event_type': 'stream_end', 'task_id': task_id})}\n\n"
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield f": heartbeat\n\n"
        finally:
            await event_bus.unsubscribe(task_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/{task_id}/result")
def get_task_result(task_id: str):
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "task_id": task_id,
        "status": task["status"],
        "final_result": task["final_result"],
        "duration_seconds": task["duration_seconds"],
        "memory_references": task["memory_references"]
    }

@router.post("/{task_id}/retry", response_model=TaskResponse)
async def retry_task(task_id: str, background_tasks: BackgroundTasks):
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_service.update_task(task_id, status="pending", final_result="", error_message="")
    background_tasks.add_task(orchestrator.run_orchestration, task_id=task_id)
    return task_service.get_task(task_id)

@router.delete("/{task_id}")
def delete_task(task_id: str):
    success = task_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task successfully deleted", "task_id": task_id}
