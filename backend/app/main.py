from contextlib import asynccontextmanager
from backend.app.core.utils import utc_now_iso
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.seed import seed_demo_data
from backend.app.integrations.qdrant import qdrant_service
from backend.app.api.v1.tasks import router as tasks_router
from backend.app.api.v1.agents import router as agents_router
from backend.app.api.v1.memory import router as memory_router
from backend.app.api.v1.voice import router as voice_router
from backend.app.api.v1.integrations import router as integrations_router
from backend.app.api.v1.analytics import router as analytics_router

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

# Versioned API v1 Router Registration
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": utc_now_iso()
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "NEXUS AI Multi-Agent Orchestration Backend Operational",
        "docs_url": "/docs",
        "version": settings.APP_VERSION
    }
