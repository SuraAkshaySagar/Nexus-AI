import os
import sys

# Ensure project root and backend dir are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
for p in [project_root, backend_dir, current_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.utils import utc_now_iso
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.seed import seed_demo_data
from backend.app.integrations.qdrant import qdrant_service
from backend.app.services.memory_service import memory_service
from backend.app.schemas.memory import MemoryCreate, MemoryResponse

# Router Imports
from backend.app.api.v1.tasks import router as tasks_router
from backend.app.api.v1.agents import router as agents_router
from backend.app.api.v1.memory import router as memory_router
from backend.app.api.v1.voice import router as voice_router, omi_conversation_webhook, omi_realtime_webhook
from backend.app.api.v1.integrations import router as integrations_router, get_integrations_status
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and verify memory cluster
    init_db()
    seed_demo_data()
    try:
        if settings.QDRANT_URL and settings.QDRANT_API_KEY:
            qdrant_service.ensure_collection()
            print("[NEXUS] Qdrant collection verified successfully.")
    except Exception as e:
        print(f"[NEXUS] Startup Qdrant notice: {e}")
    yield
    # Shutdown
    print("[NEXUS] Engine shutdown completed.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="3D Collaborative Multi-Agent Orchestration Dashboard API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for clean error responses
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": str(exc), "timestamp": utc_now_iso()}
    )

# --- Phase 2 Mandatory Top-Level Endpoints ---

@app.get("/health", tags=["Health"])
def health_endpoint():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": utc_now_iso()
    }

@app.get("/api/status", tags=["Status"])
async def api_status_endpoint():
    """Integration and service health status."""
    return await get_integrations_status()

# Direct Chat Endpoint (POST /api/chat)
app.include_router(chat_router)

@app.get("/api/memories", response_model=List[MemoryResponse], tags=["Memory"])
def get_memories_endpoint(
    q: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(default=10, le=50),
    topic: Optional[str] = None,
    user_id: Optional[str] = "default_user"
):
    """Retrieve/search vector memories from Qdrant."""
    query = q or "NEXUS multi-agent system"
    return memory_service.search(query=query, limit=limit, topic=topic, user_id=user_id)

@app.post("/api/memories", response_model=MemoryResponse, tags=["Memory"])
def create_memory_endpoint(data: MemoryCreate):
    """Store new knowledge memory into Qdrant."""
    return memory_service.store_memory(
        text=data.text,
        topic=data.topic,
        source=data.source,
        task_id=data.task_id,
        user_id=data.user_id or "default_user",
        metadata=data.metadata
    )

@app.post("/omi/conversation", tags=["Omi"])
async def omi_conversation_route(
    request: Request,
    x_omi_secret: Optional[str] = Header(None)
):
    """Top-level Omi conversation webhook handler."""
    return await omi_conversation_webhook(request, x_omi_secret)

@app.post("/omi/realtime", tags=["Omi"])
async def omi_realtime_route(
    request: Request,
    x_omi_secret: Optional[str] = Header(None)
):
    """Top-level Omi real-time chunk webhook handler."""
    return await omi_realtime_webhook(request, x_omi_secret)

# --- Versioned API v1 Routers ---
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["Health"])
def health_check_v1():
    return health_endpoint()

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "NEXUS AI Multi-Agent Orchestration Backend Operational",
        "docs_url": "/docs",
        "version": settings.APP_VERSION
    }
