import uuid
from typing import List, Dict, Any, Optional
from backend.app.integrations.qdrant import qdrant_service

class MemoryService:
    def search(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.0,
        user_id: Optional[str] = "default_user",
        topic: Optional[str] = None,
        source: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            return qdrant_service.search_memories(
                query=query,
                limit=limit,
                score_threshold=score_threshold,
                user_id=user_id,
                topic=topic,
                source=source
            )
        except Exception as e:
            print(f"[MemoryService] Search error: {e}")
            return []

    def store_memory(
        self,
        text: str,
        topic: str = "General",
        source: str = "manual_entry",
        task_id: Optional[str] = None,
        user_id: str = "default_user",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        memory_id = str(uuid.uuid4())
        return qdrant_service.upsert_memory(
            memory_id=memory_id,
            text=text,
            user_id=user_id,
            task_id=task_id,
            topic=topic,
            source=source,
            metadata=metadata or {}
        )

    def delete_memory(self, memory_id: str) -> bool:
        return qdrant_service.delete_memory(memory_id)

    def clear_memories(self, user_id: Optional[str] = None) -> bool:
        return qdrant_service.clear_collection(user_id=user_id)

    def get_stats(self) -> Dict[str, Any]:
        return qdrant_service.get_stats()

memory_service = MemoryService()
