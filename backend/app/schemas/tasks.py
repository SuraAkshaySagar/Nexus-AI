from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TaskCreate(BaseModel):
    title: Optional[str] = None
    prompt: str = Field(..., min_length=3, description="Task prompt or detailed instruction")
    category: str = Field(default="General", description="Research, Architecture, Planning, Analysis, General")
    orchestration_mode: str = Field(default="manager_guided", description="manager_guided, autonomous, hierarchical")
    priority: str = Field(default="normal", description="normal, high, critical")
    source: str = Field(default="dashboard", description="dashboard, omi_voice, api")
    user_id: Optional[str] = "default_user"
    context: Optional[str] = None
    save_to_memory: bool = True

class TaskEventResponse(BaseModel):
    id: str
    task_id: str
    agent_name: str
    event_type: str
    status: str
    message: str
    payload: Dict[str, Any] = {}
    timestamp: str

class TaskResponse(BaseModel):
    id: str
    title: str
    prompt: str
    category: str
    orchestration_mode: str
    priority: str
    source: str
    status: str
    assigned_agents: List[str] = []
    memory_references: List[Dict[str, Any]] = []
    final_result: Optional[str] = ""
    error_message: Optional[str] = ""
    duration_seconds: float = 0.0
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None

class TaskDetailResponse(TaskResponse):
    events: List[TaskEventResponse] = []
