from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MemoryCreate(BaseModel):
    text: str = Field(..., min_length=2, description="Content to vectorize and store in Qdrant")
    topic: str = Field(default="General", description="Classification topic")
    source: str = Field(default="manual_entry", description="task_execution, omi_transcript, manual_entry")
    task_id: Optional[str] = None
    user_id: Optional[str] = "default_user"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MemoryResponse(BaseModel):
    memory_id: str
    text: str
    topic: str
    source: str
    task_id: Optional[str] = None
    user_id: Optional[str] = "default_user"
    created_at: str
    metadata: Dict[str, Any] = {}
    score: Optional[float] = None

class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=50)
    score_threshold: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    topic: Optional[str] = None
    source: Optional[str] = None
    user_id: Optional[str] = "default_user"

class MemoryStatsResponse(BaseModel):
    collection_name: str
    status: str
    total_vectors_count: int
    indexed_vectors_count: int
    vector_dimension: int
    distance_metric: str
    is_connected: bool
    error: Optional[str] = None
