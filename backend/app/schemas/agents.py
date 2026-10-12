from pydantic import BaseModel, Field
from typing import Optional

class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    description: str
    lyzr_agent_id: Optional[str] = ""
    is_manager: bool
    enabled: bool
    status: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    avg_response_time_ms: float
    created_at: str

class AgentRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    role: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    lyzr_agent_id: str = Field(..., min_length=1, description="Official Lyzr Agent Studio Agent ID")
    is_manager: bool = False
    enabled: bool = True

class AgentUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    lyzr_agent_id: Optional[str] = None
    enabled: Optional[bool] = None

class AgentTestResponse(BaseModel):
    agent_id: str
    agent_name: str
    success: bool
    status: str
    message: str
    response_time_ms: float
    raw_response: Optional[dict] = None
