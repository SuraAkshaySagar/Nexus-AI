from pydantic import BaseModel
from typing import Optional, Dict, Any

class ServiceStatus(BaseModel):
    name: str
    status: str  # connected, not_configured, failed, degraded, checking
    is_configured: bool
    endpoint: Optional[str] = None
    latency_ms: Optional[float] = None
    message: str
    details: Optional[Dict[str, Any]] = None

class IntegrationsStatusResponse(BaseModel):
    backend: ServiceStatus
    lyzr: ServiceStatus
    qdrant: ServiceStatus
    omi: ServiceStatus

class IntegrationTestResponse(BaseModel):
    service: str
    status: str
    success: bool
    latency_ms: float
    message: str
    error: Optional[str] = None
