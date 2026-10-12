from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class VoiceConversationResponse(BaseModel):
    id: str
    title: str
    source: str
    transcript: str
    speakers: List[str] = []
    action_items: List[str] = []
    extracted_tasks: List[str] = []
    associated_task_id: Optional[str] = None
    created_at: str

class VoiceExecuteRequest(BaseModel):
    category: str = Field(default="General")
    priority: str = Field(default="normal")
    save_to_memory: bool = True
