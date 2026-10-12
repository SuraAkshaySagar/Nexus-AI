import re
from typing import Dict, Any, List, Optional
from backend.app.core.utils import utc_now_iso
from backend.app.core.config import settings

class OmiIntegration:
    def __init__(self):
        self.secret = settings.OMI_WEBHOOK_SECRET
        self.last_webhook_time: Optional[str] = None
        self.webhook_count = 0
        self.last_error: Optional[str] = None

    def verify_webhook(self, received_secret: Optional[str]) -> bool:
        if not self.secret:
            return True  # If no secret configured locally, accept
        if not received_secret:
            return False
        return received_secret.strip() == self.secret.strip()

    def parse_payload(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Defensively parses diverse Omi webhook payload shapes:
        - Structured Omi format: { "id", "transcript_segments", "structured": { "title", "overview", "action_items" } }
        - Direct transcript format: { "transcript", "speakers", "action_items" }
        - Simple raw format: { "text", ... }
        """
        self.last_webhook_time = utc_now_iso()
        self.webhook_count += 1

        title = "Voice Note"
        transcript = ""
        speakers = []
        action_items = []

        # Case 1: Standard Omi structured memory export
        if "structured" in data and isinstance(data["structured"], dict):
            struct = data["structured"]
            title = struct.get("title") or title
            action_items = [item.get("description", str(item)) if isinstance(item, dict) else str(item) for item in struct.get("action_items", [])]

        if "transcript_segments" in data and isinstance(data["transcript_segments"], list):
            segments = []
            for seg in data["transcript_segments"]:
                speaker = seg.get("speaker", "Speaker")
                text = seg.get("text", "")
                if speaker not in speakers:
                    speakers.append(speaker)
                segments.append(f"{speaker}: {text}")
            transcript = "\n".join(segments)
        elif "transcript" in data:
            transcript = str(data["transcript"])
        elif "text" in data:
            transcript = str(data["text"])
        elif "conversation" in data:
            transcript = str(data["conversation"])

        # Title fallback
        if title == "Voice Note" and transcript:
            first_line = transcript.split("\n")[0][:60]
            title = f"Voice Note: {first_line}..."

        # Case 2: Extract action items heuristically if empty
        if not action_items and transcript:
            action_items = self.extract_action_items(transcript)

        # Extract tasks directly suitable for NEXUS orchestration
        extracted_tasks = self.extract_tasks(transcript, action_items)

        return {
            "title": title,
            "transcript": transcript,
            "speakers": speakers if speakers else ["User"],
            "action_items": action_items,
            "extracted_tasks": extracted_tasks,
            "raw_payload": data
        }

    def extract_action_items(self, text: str) -> List[str]:
        items = []
        lines = text.split("\n")
        action_verbs = r"\b(need to|should|must|will|action|todo|create|build|investigate|implement|deploy|review|fix|check)\b"
        for line in lines:
            cleaned = line.strip().lstrip("-*•0123456789. ")
            if re.search(action_verbs, cleaned, re.IGNORECASE) and len(cleaned) > 10:
                items.append(cleaned)
        return items[:6]

    def extract_tasks(self, transcript: str, action_items: List[str]) -> List[str]:
        if action_items:
            return action_items
        # Return sensible task summary
        sentences = [s.strip() for s in re.split(r"[.!?]", transcript) if len(s.strip()) > 15]
        return sentences[:3] if sentences else ["Analyze voice note discussion and generate action plan."]

    def get_status(self) -> Dict[str, Any]:
        is_configured = bool(self.secret)
        return {
            "status": "connected" if self.last_webhook_time else ("configured" if is_configured else "not_configured"),
            "is_configured": is_configured,
            "latency_ms": 0.0,
            "message": f"Omi integration ready. Received {self.webhook_count} webhooks." if self.last_webhook_time else "Waiting for Omi webhook payloads.",
            "last_webhook_time": self.last_webhook_time,
            "webhook_count": self.webhook_count,
            "last_error": self.last_error
        }

omi_service = OmiIntegration()
