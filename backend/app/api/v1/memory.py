from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.memory import (
    MemoryCreate, MemoryResponse, MemoryStatsResponse
)
from backend.app.services.memory_service import memory_service

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("/search", response_model=List[MemoryResponse])
def search_memory(
    q: str = Query(..., min_length=1, description="Semantic search query"),
    limit: int = Query(default=10, le=50),
    score_threshold: float = Query(default=0.0, ge=0.0, le=1.0),
    topic: Optional[str] = None,
    source: Optional[str] = None,
    user_id: Optional[str] = "default_user"
):
    return memory_service.search(
        query=q,
        limit=limit,
        score_threshold=score_threshold,
        user_id=user_id,
        topic=topic,
        source=source
    )

@router.post("", response_model=MemoryResponse)
def create_memory(data: MemoryCreate):
    try:
        stored = memory_service.store_memory(
            text=data.text,
            topic=data.topic,
            source=data.source,
            task_id=data.task_id,
            user_id=data.user_id or "default_user",
            metadata=data.metadata
        )
        return stored
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store memory point in Qdrant: {str(e)}")

@router.delete("/{memory_id}")
def delete_memory(memory_id: str):
    success = memory_service.delete_memory(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory point not found or could not be deleted")
    return {"message": "Memory point deleted", "memory_id": memory_id}

@router.delete("")
def clear_memories(user_id: Optional[str] = None):
    success = memory_service.clear_memories(user_id=user_id)
    return {"message": "Memory collection cleared successfully", "user_id": user_id}

@router.get("/stats", response_model=MemoryStatsResponse)
def get_memory_stats():
    return memory_service.get_stats()
