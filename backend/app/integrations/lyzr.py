import time
import httpx
from typing import Dict, Any, Optional, List
from backend.app.core.config import settings

class LyzrIntegration:
    def __init__(self):
        self.api_key = settings.LYZR_API_KEY
        self.manager_agent_id = settings.LYZR_AGENT_ID
        self.base_url = settings.LYZR_BASE_URL.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "status": "not_configured",
                "is_configured": False,
                "latency_ms": 0.0,
                "message": "Lyzr API Key not configured. Add LYZR_API_KEY to backend .env or Integrations page.",
                "error": None
            }

        start_time = time.time()
        try:
            # Test Lyzr Agent Studio endpoint using documented headers
            headers = {
                "x-api-key": self.api_key.strip(),
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Check agent availability or ping
                test_endpoint = f"{self.base_url}/v2/agent/{self.manager_agent_id}" if self.manager_agent_id else f"{self.base_url}/v2/health"
                response = await client.get(test_endpoint, headers=headers)
                latency = (time.time() - start_time) * 1000.0

                if response.status_code in (200, 201):
                    return {
                        "status": "connected",
                        "is_configured": True,
                        "latency_ms": round(latency, 2),
                        "message": f"Successfully connected to Lyzr Agent Studio. Manager: {self.manager_agent_id or 'Default'}",
                        "details": response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    }
                elif response.status_code in (401, 403):
                    return {
                        "status": "failed",
                        "is_configured": True,
                        "latency_ms": round(latency, 2),
                        "message": f"Lyzr Authentication Failed ({response.status_code}): Invalid API Key.",
                        "error": response.text
                    }
                else:
                    return {
                        "status": "degraded",
                        "is_configured": True,
                        "latency_ms": round(latency, 2),
                        "message": f"Lyzr API returned unexpected status {response.status_code}.",
                        "error": response.text
                    }
        except httpx.RequestError as e:
            latency = (time.time() - start_time) * 1000.0
            return {
                "status": "failed",
                "is_configured": True,
                "latency_ms": round(latency, 2),
                "message": f"Failed to connect to Lyzr endpoint ({self.base_url}): {str(e)}",
                "error": str(e)
            }

    async def test_agent(self, agent_id: str) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "agent_id": agent_id,
                "success": False,
                "status": "not_configured",
                "message": "Lyzr API Key not configured.",
                "response_time_ms": 0.0,
                "raw_response": None
            }

        start_time = time.time()
        headers = {
            "x-api-key": self.api_key.strip(),
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                url = f"{self.base_url}/v2/chat/"
                payload = {
                    "user_id": "nexus-test",
                    "agent_id": agent_id,
                    "message": "Echo test from NEXUS AI orchestration health check.",
                    "session_id": f"test-{int(time.time())}"
                }
                res = await client.post(url, headers=headers, json=payload)
                latency = (time.time() - start_time) * 1000.0

                if res.status_code in (200, 201):
                    return {
                        "agent_id": agent_id,
                        "success": True,
                        "status": "connected",
                        "message": "Agent verified and active.",
                        "response_time_ms": round(latency, 2),
                        "raw_response": res.json() if res.headers.get("content-type", "").startswith("application/json") else {"text": res.text}
                    }
                else:
                    return {
                        "agent_id": agent_id,
                        "success": False,
                        "status": "failed",
                        "message": f"Agent test failed with status {res.status_code}: {res.text[:200]}",
                        "response_time_ms": round(latency, 2),
                        "raw_response": None
                    }
        except Exception as e:
            latency = (time.time() - start_time) * 1000.0
            return {
                "agent_id": agent_id,
                "success": False,
                "status": "failed",
                "message": f"Network exception calling Lyzr: {str(e)}",
                "response_time_ms": round(latency, 2),
                "raw_response": None
            }

    async def execute_manager_agent(
        self,
        prompt: str,
        memory_context: List[Dict[str, Any]],
        session_id: str,
        user_id: str = "nexus-user",
        target_agent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        agent_id = target_agent_id or self.manager_agent_id
        if not self.is_configured or not agent_id:
            # Explicitly not configured
            return {
                "status": "not_configured",
                "output": "",
                "error": "Lyzr Manager Agent ID or API Key is not configured."
            }

        headers = {
            "x-api-key": self.api_key.strip(),
            "Content-Type": "application/json"
        }
        
        # Format memory context into the prompt
        context_block = ""
        if memory_context:
            context_block = "\n\n--- RETRIEVED QDRANT MEMORY CONTEXT ---\n" + "\n".join(
                [f"[{m.get('topic', 'Memory')}] (Relevance: {m.get('score', 'N/A')}): {m.get('text')}" for m in memory_context]
            ) + "\n---------------------------------------\n"

        full_message = f"{prompt}{context_block}"

        url = f"{self.base_url}/v2/chat/"
        payload = {
            "user_id": user_id,
            "agent_id": agent_id,
            "message": full_message,
            "session_id": session_id
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code in (200, 201):
                data = res.json()
                response_text = data.get("response") or data.get("message") or str(data)
                return {
                    "status": "completed",
                    "output": response_text,
                    "raw": data
                }
            else:
                return {
                    "status": "failed",
                    "output": "",
                    "error": f"Lyzr API error ({res.status_code}): {res.text}"
                }

lyzr_service = LyzrIntegration()
