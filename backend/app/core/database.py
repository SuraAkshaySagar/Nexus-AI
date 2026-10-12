import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from backend.app.core.utils import utc_now_iso
from backend.app.core.config import settings

DB_FILE = os.path.abspath(settings.DATABASE_URL.replace("sqlite:///", ""))

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_FILE) or ".", exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Tasks table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            orchestration_mode TEXT NOT NULL DEFAULT 'manager_guided',
            priority TEXT NOT NULL DEFAULT 'normal',
            source TEXT NOT NULL DEFAULT 'dashboard',
            status TEXT NOT NULL DEFAULT 'pending',
            assigned_agents TEXT NOT NULL DEFAULT '[]',
            memory_references TEXT NOT NULL DEFAULT '[]',
            final_result TEXT DEFAULT '',
            error_message TEXT DEFAULT '',
            duration_seconds REAL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            completed_at TEXT
        );
        """)

        # Task events table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_events (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            payload TEXT NOT NULL DEFAULT '{}',
            timestamp TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
        """)

        # Agents configuration table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            description TEXT NOT NULL,
            lyzr_agent_id TEXT DEFAULT '',
            is_manager INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'idle',
            total_executions INTEGER NOT NULL DEFAULT 0,
            successful_executions INTEGER NOT NULL DEFAULT 0,
            failed_executions INTEGER NOT NULL DEFAULT 0,
            avg_response_time_ms REAL NOT NULL DEFAULT 0.0,
            created_at TEXT NOT NULL
        );
        """)

        # Voice conversations table (Omi)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS voice_conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'omi_webhook',
            transcript TEXT NOT NULL,
            speakers TEXT NOT NULL DEFAULT '[]',
            action_items TEXT NOT NULL DEFAULT '[]',
            extracted_tasks TEXT NOT NULL DEFAULT '[]',
            associated_task_id TEXT,
            raw_payload TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        );
        """)

        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_task_id ON task_events(task_id);")

        conn.commit()

        # Seed initial agents if not present
        cursor.execute("SELECT COUNT(*) as count FROM agents;")
        if cursor.fetchone()["count"] == 0:
            default_agents = [
                (
                    "nexus-manager",
                    "NEXUS Orchestration Manager",
                    "Manager Agent",
                    "Coordinates multi-agent workflows, decomposes tasks, delegates to specialist agents, and synthesizes outputs using Lyzr Orchestrator.",
                    settings.LYZR_AGENT_ID,
                    1, 1, "idle", 0, 0, 0, 0.0, utc_now_iso()
                ),
                (
                    "nexus-researcher",
                    "NEXUS Deep Researcher",
                    "Research Agent",
                    "Performs factual inquiry, data synthesis, background research, and literature review.",
                    "",
                    0, 1, "idle", 0, 0, 0, 0.0, utc_now_iso()
                ),
                (
                    "nexus-architect",
                    "NEXUS Technical Architect",
                    "Technical Analyst Agent",
                    "Evaluates system architectures, code patterns, technical trade-offs, and design topologies.",
                    "",
                    0, 1, "idle", 0, 0, 0, 0.0, utc_now_iso()
                ),
                (
                    "nexus-planner",
                    "NEXUS Strategic Planner",
                    "Planning Agent",
                    "Generates structured execution roadmaps, milestone dependencies, and step-by-step implementation phases.",
                    "",
                    0, 1, "idle", 0, 0, 0, 0.0, utc_now_iso()
                ),
                (
                    "nexus-reviewer",
                    "NEXUS Quality Reviewer",
                    "Review Agent",
                    "Performs quality audits, safety verification, consistency checking, and hallucination filtering.",
                    "",
                    0, 1, "idle", 0, 0, 0, 0.0, utc_now_iso()
                )
            ]
            cursor.executemany("""
            INSERT INTO agents (id, name, role, description, lyzr_agent_id, is_manager, enabled, status, total_executions, successful_executions, failed_executions, avg_response_time_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, default_agents)
            conn.commit()

# Ensure database is initialized when module is loaded
init_db()
