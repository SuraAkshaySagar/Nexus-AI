from fastapi import APIRouter
from backend.app.services.task_service import task_service
from backend.app.core.database import get_connection

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview():
    analytics = task_service.get_analytics()
    
    # Also fetch agent execution distribution
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, role, total_executions, successful_executions, failed_executions, avg_response_time_ms FROM agents;")
        agents = [dict(r) for r in cursor.fetchall()]

    analytics["agents_metrics"] = agents
    return analytics
