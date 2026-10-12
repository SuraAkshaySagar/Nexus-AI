import time
from fastapi import APIRouter, HTTPException

from backend.app.schemas.integrations import (
    IntegrationsStatusResponse, ServiceStatus, IntegrationTestResponse
)
from backend.app.core.config import settings
from backend.app.integrations.lyzr import lyzr_service
from backend.app.integrations.qdrant import qdrant_service
from backend.app.integrations.omi import omi_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("/status", response_model=IntegrationsStatusResponse)
async def get_integrations_status():
    # 1. Backend Status
    backend_status = ServiceStatus(
        name="NEXUS Core Backend",
        status="connected",
        is_configured=True,
        endpoint=f"http://{settings.HOST}:{settings.PORT}",
        latency_ms=1.2,
        message=f"FastAPI v{settings.APP_VERSION} operational (Environment: {settings.APP_ENV})",
        details={"version": settings.APP_VERSION, "env": settings.APP_ENV}
    )

    # 2. Qdrant Status
    qdrant_res = qdrant_service.test_connection()
    qdrant_status = ServiceStatus(
        name="Qdrant Vector Memory",
        status=qdrant_res["status"],
        is_configured=qdrant_res["is_configured"],
        endpoint=settings.QDRANT_URL,
        latency_ms=qdrant_res.get("latency_ms"),
        message=qdrant_res["message"],
        details=qdrant_res.get("details")
    )

    # 3. Lyzr Status
    lyzr_res = await lyzr_service.test_connection()
    lyzr_status = ServiceStatus(
        name="Lyzr Agent Studio",
        status=lyzr_res["status"],
        is_configured=lyzr_res["is_configured"],
        endpoint=settings.LYZR_BASE_URL,
        latency_ms=lyzr_res.get("latency_ms"),
        message=lyzr_res["message"],
        details=lyzr_res.get("details")
    )

    # 4. Omi Voice Status
    omi_res = omi_service.get_status()
    omi_status = ServiceStatus(
        name="Omi Voice Intelligence",
        status=omi_res["status"],
        is_configured=omi_res["is_configured"],
        endpoint="/api/v1/integrations/omi/conversation",
        latency_ms=0.0,
        message=omi_res["message"],
        details={
            "webhook_count": omi_res["webhook_count"],
            "last_webhook_time": omi_res["last_webhook_time"]
        }
    )

    return IntegrationsStatusResponse(
        backend=backend_status,
        lyzr=lyzr_status,
        qdrant=qdrant_status,
        omi=omi_status
    )

@router.post("/test/{service}", response_model=IntegrationTestResponse)
async def test_integration_service(service: str):
    service_clean = service.lower().strip()
    if service_clean == "qdrant":
        res = qdrant_service.test_connection()
        return IntegrationTestResponse(
            service="Qdrant",
            status=res["status"],
            success=(res["status"] == "connected"),
            latency_ms=res.get("latency_ms", 0.0),
            message=res["message"],
            error=res.get("error")
        )
    elif service_clean == "lyzr":
        res = await lyzr_service.test_connection()
        return IntegrationTestResponse(
            service="Lyzr",
            status=res["status"],
            success=(res["status"] == "connected"),
            latency_ms=res.get("latency_ms", 0.0),
            message=res["message"],
            error=res.get("error")
        )
    elif service_clean == "omi":
        res = omi_service.get_status()
        return IntegrationTestResponse(
            service="Omi",
            status=res["status"],
            success=res["is_configured"],
            latency_ms=0.0,
            message=res["message"]
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown service '{service}'")
