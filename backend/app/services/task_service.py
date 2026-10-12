import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import timedelta
from backend.app.core.utils import utc_now_iso
from backend.app.core.database import get_connection

class TaskService:
    def create_task(
        self,
        prompt: str,
        title: Optional[str] = None,
        category: str = "General",
        orchestration_mode: str = "manager_guided",
        priority: str = "normal",
        source: str = "dashboard"
    ) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        now = utc_now_iso()
        auto_title = title or (prompt[:50] + "..." if len(prompt) > 50 else prompt)

        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO tasks (id, title, prompt, category, orchestration_mode, priority, source, status, assigned_agents, memory_references, final_result, error_message, duration_seconds, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', '[]', '[]', '', '', 0.0, ?, ?);
            """, (task_id, auto_title, prompt, category, orchestration_mode, priority, source, now, now))
            conn.commit()

        return self.get_task(task_id)

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks WHERE id = ?;", (task_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["assigned_agents"] = json.loads(data["assigned_agents"])
            data["memory_references"] = json.loads(data["memory_references"])
            return data

    def list_tasks(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM tasks WHERE 1=1"
            params: List[Any] = []

            if status:
                query += " AND status = ?"
                params.append(status)
            if category:
                query += " AND category = ?"
                params.append(category)
            if search:
                query += " AND (title LIKE ? OR prompt LIKE ?)"
                params.append(f"%{search}%")
                params.append(f"%{search}%")

            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?;"
            params.extend([limit, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()
            output = []
            for r in rows:
                item = dict(r)
                item["assigned_agents"] = json.loads(item["assigned_agents"])
                item["memory_references"] = json.loads(item["memory_references"])
                output.append(item)
            return output

    def record_event(
        self,
        task_id: str,
        agent_name: str,
        event_type: str,
        status: str,
        message: str,
        payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        event_id = str(uuid.uuid4())
        now = utc_now_iso()
        payload_str = json.dumps(payload or {})

        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO task_events (id, task_id, agent_name, event_type, status, message, payload, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (event_id, task_id, agent_name, event_type, status, message, payload_str, now))
            
            cursor.execute("UPDATE tasks SET updated_at = ? WHERE id = ?;", (now, task_id))
            conn.commit()

        return {
            "id": event_id,
            "task_id": task_id,
            "agent_name": agent_name,
            "event_type": event_type,
            "status": status,
            "message": message,
            "payload": payload or {},
            "timestamp": now
        }

    def get_events(self, task_id: str) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM task_events WHERE task_id = ? ORDER BY timestamp ASC;", (task_id,))
            rows = cursor.fetchall()
            output = []
            for r in rows:
                item = dict(r)
                item["payload"] = json.loads(item["payload"])
                output.append(item)
            return output

    def update_task(
        self,
        task_id: str,
        status: Optional[str] = None,
        assigned_agents: Optional[List[str]] = None,
        memory_references: Optional[List[Dict[str, Any]]] = None,
        final_result: Optional[str] = None,
        error_message: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        completed_at: Optional[str] = None
    ):
        with get_connection() as conn:
            cursor = conn.cursor()
            now = utc_now_iso()
            fields = ["updated_at = ?"]
            params: List[Any] = [now]

            if status is not None:
                fields.append("status = ?")
                params.append(status)
            if assigned_agents is not None:
                fields.append("assigned_agents = ?")
                params.append(json.dumps(assigned_agents))
            if memory_references is not None:
                fields.append("memory_references = ?")
                params.append(json.dumps(memory_references))
            if final_result is not None:
                fields.append("final_result = ?")
                params.append(final_result)
            if error_message is not None:
                fields.append("error_message = ?")
                params.append(error_message)
            if duration_seconds is not None:
                fields.append("duration_seconds = ?")
                params.append(duration_seconds)
            if completed_at is not None:
                fields.append("completed_at = ?")
                params.append(completed_at)

            params.append(task_id)
            sql = f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?;"
            cursor.execute(sql, params)
            conn.commit()

    def delete_task(self, task_id: str) -> bool:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
            conn.commit()
            return True

    def get_analytics(self) -> Dict[str, Any]:
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # Total counts
            cursor.execute("SELECT COUNT(*) as total FROM tasks;")
            total_tasks = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) as active FROM tasks WHERE status IN ('pending', 'retrieving_memory', 'planning', 'executing', 'reviewing');")
            active_tasks = cursor.fetchone()["active"]

            cursor.execute("SELECT COUNT(*) as completed FROM tasks WHERE status = 'completed';")
            completed_tasks = cursor.fetchone()["completed"]

            cursor.execute("SELECT COUNT(*) as failed FROM tasks WHERE status = 'failed';")
            failed_tasks = cursor.fetchone()["failed"]

            cursor.execute("SELECT AVG(duration_seconds) as avg_duration FROM tasks WHERE status = 'completed' AND duration_seconds > 0;")
            row = cursor.fetchone()
            avg_duration = round(row["avg_duration"] or 0.0, 1)

            # Success rate
            success_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 100.0

            # Categories distribution
            cursor.execute("SELECT category, COUNT(*) as count FROM tasks GROUP BY category;")
            category_counts = [{"name": r["category"], "value": r["count"]} for r in cursor.fetchall()]

            # Task daily trends (last 7 days)
            trends = []
            from datetime import timezone, datetime as dt
            for i in range(6, -1, -1):
                day = (dt.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
                cursor.execute("SELECT COUNT(*) as cnt FROM tasks WHERE created_at LIKE ?;", (f"{day}%",))
                cnt = cursor.fetchone()["cnt"]
                cursor.execute("SELECT COUNT(*) as comp FROM tasks WHERE status = 'completed' AND created_at LIKE ?;", (f"{day}%",))
                comp = cursor.fetchone()["comp"]
                trends.append({
                    "date": day,
                    "tasks": cnt,
                    "completed": comp
                })

            return {
                "total_tasks": total_tasks,
                "active_tasks": active_tasks,
                "completed_tasks": completed_tasks,
                "failed_tasks": failed_tasks,
                "avg_duration": avg_duration,
                "success_rate": success_rate,
                "category_distribution": category_counts,
                "daily_trends": trends
            }

task_service = TaskService()
