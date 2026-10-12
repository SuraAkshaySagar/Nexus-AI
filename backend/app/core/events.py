import asyncio
import json
from typing import Dict, List, Any
from datetime import datetime

class EventBus:
    def __init__(self):
        # task_id -> list of subscriber queues
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, task_id: str) -> asyncio.Queue:
        async with self._lock:
            queue = asyncio.Queue()
            if task_id not in self._subscribers:
                self._subscribers[task_id] = []
            self._subscribers[task_id].append(queue)
            return queue

    async def unsubscribe(self, task_id: str, queue: asyncio.Queue):
        async with self._lock:
            if task_id in self._subscribers:
                if queue in self._subscribers[task_id]:
                    self._subscribers[task_id].remove(queue)
                if not self._subscribers[task_id]:
                    del self._subscribers[task_id]

    async def publish(self, task_id: str, event_data: Dict[str, Any]):
        async with self._lock:
            if task_id in self._subscribers:
                for queue in self._subscribers[task_id]:
                    await queue.put(event_data)

event_bus = EventBus()
