import time
import uuid
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.core.utils import utc_now_iso

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from backend.app.core.config import settings

class QdrantIntegration:
    def __init__(self):
        self.url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_dim = settings.VECTOR_DIMENSION
        self._client: Optional[QdrantClient] = None
        self._embedder = None
        self._embedder_ready = False

    def _get_client(self) -> QdrantClient:
        if self._client is None:
            clean_key = self.api_key.strip().lstrip(".") if self.api_key else None
            self._client = QdrantClient(
                url=self.url,
                api_key=clean_key,
                timeout=12.0,
                check_compatibility=False
            )
        return self._client

    def _get_embedder(self):
        if not self._embedder_ready:
            try:
                from fastembed import TextEmbedding
                self._embedder = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
                self._embedder_ready = True
            except Exception as e:
                print(f"[Qdrant] FastEmbed load failed ({e}), using fallback deterministic embedding.")
                self._embedder = None
                self._embedder_ready = True
        return self._embedder

    def embed_text(self, text: str) -> List[float]:
        embedder = self._get_embedder()
        if embedder is not None:
            try:
                vectors = list(embedder.embed([text]))
                return vectors[0].tolist()
            except Exception as e:
                print(f"[Qdrant] FastEmbed encoding error ({e}), falling back to deterministic vector.")

        # Robust, high-entropy fallback embedding generator for dimension 384
        # guarantees consistent mathematical similarity for identical or overlapping terms
        dim = self.vector_dim
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return vec.tolist()
        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 8) % 2 == 0) else -1.0
            vec[idx] += sign * (1.0 / (1.0 + (i * 0.05)))
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def test_connection(self) -> Dict[str, Any]:
        if not self.url:
            return {
                "status": "not_configured",
                "is_configured": False,
                "latency_ms": 0.0,
                "message": "Qdrant URL not configured in environment.",
                "error": None
            }

        start_time = time.time()
        try:
            client = self._get_client()
            collections_result = client.get_collections()
            latency = (time.time() - start_time) * 1000.0

            # Ensure nexus_memory collection exists
            existing = [c.name for c in collections_result.collections]
            collection_exists = self.collection_name in existing
            if not collection_exists:
                client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.vector_dim,
                        distance=qmodels.Distance.COSINE
                    )
                )

            return {
                "status": "connected",
                "is_configured": True,
                "latency_ms": round(latency, 2),
                "message": f"Connected to Qdrant cluster. Collection '{self.collection_name}' ready.",
                "details": {
                    "collections": existing,
                    "active_collection": self.collection_name
                }
            }
        except Exception as e:
            latency = (time.time() - start_time) * 1000.0
            return {
                "status": "failed",
                "is_configured": bool(self.api_key),
                "latency_ms": round(latency, 2),
                "message": f"Connection to Qdrant failed: {str(e)}",
                "error": str(e)
            }

    def ensure_collection(self):
        client = self._get_client()
        collections_result = client.get_collections()
        existing = [c.name for c in collections_result.collections]
        if self.collection_name not in existing:
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config=qmodels.VectorParams(
                    size=self.vector_dim,
                    distance=qmodels.Distance.COSINE
                )
            )

    def upsert_memory(
        self,
        memory_id: str,
        text: str,
        user_id: str = "default_user",
        task_id: Optional[str] = None,
        topic: str = "General",
        source: str = "manual_entry",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        self.ensure_collection()
        client = self._get_client()
        vector = self.embed_text(text)
        created_at = utc_now_iso()

        payload = {
            "memory_id": memory_id,
            "text": text,
            "user_id": user_id,
            "task_id": task_id,
            "topic": topic,
            "source": source,
            "created_at": created_at,
            "metadata": metadata or {}
        }

        # Qdrant accepts valid UUIDs or unsigned integers as point IDs
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, memory_id))

        client.upsert(
            collection_name=self.collection_name,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )

        return {
            "memory_id": memory_id,
            "point_id": point_id,
            "text": text,
            "topic": topic,
            "source": source,
            "task_id": task_id,
            "user_id": user_id,
            "created_at": created_at,
            "metadata": metadata or {}
        }

    def search_memories(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.0,
        user_id: Optional[str] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self.ensure_collection()
        client = self._get_client()
        query_vector = self.embed_text(query)

        filter_conditions = []
        if user_id:
            filter_conditions.append(
                qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=user_id))
            )
        if topic:
            filter_conditions.append(
                qmodels.FieldCondition(key="topic", match=qmodels.MatchValue(value=topic))
            )
        if source:
            filter_conditions.append(
                qmodels.FieldCondition(key="source", match=qmodels.MatchValue(value=source))
            )

        query_filter = qmodels.Filter(must=filter_conditions) if filter_conditions else None

        # Execute search using Qdrant client
        results = client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold if score_threshold > 0 else None,
            query_filter=query_filter,
            with_payload=True
        )

        output = []
        for r in results:
            payload = r.payload or {}
            output.append({
                "memory_id": payload.get("memory_id", str(r.id)),
                "text": payload.get("text", ""),
                "topic": payload.get("topic", "General"),
                "source": payload.get("source", "system"),
                "task_id": payload.get("task_id"),
                "user_id": payload.get("user_id"),
                "created_at": payload.get("created_at", ""),
                "metadata": payload.get("metadata", {}),
                "score": round(float(r.score), 4)
            })
        return output

    def delete_memory(self, memory_id: str) -> bool:
        client = self._get_client()
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, memory_id))
        client.delete(
            collection_name=self.collection_name,
            points_selector=qmodels.PointIdsList(points=[point_id])
        )
        return True

    def clear_collection(self, user_id: Optional[str] = None) -> bool:
        client = self._get_client()
        if user_id:
            client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[qmodels.FieldCondition(key="user_id", match=qmodels.MatchValue(value=user_id))]
                    )
                )
            )
        else:
            client.delete_collection(collection_name=self.collection_name)
            self.ensure_collection()
        return True

    def get_stats(self) -> Dict[str, Any]:
        try:
            client = self._get_client()
            info = client.get_collection(collection_name=self.collection_name)
            return {
                "collection_name": self.collection_name,
                "status": str(info.status),
                "total_vectors_count": info.points_count or 0,
                "indexed_vectors_count": info.indexed_vectors_count or 0,
                "vector_dimension": self.vector_dim,
                "distance_metric": "Cosine",
                "is_connected": True,
                "error": None
            }
        except Exception as e:
            return {
                "collection_name": self.collection_name,
                "status": "unavailable",
                "total_vectors_count": 0,
                "indexed_vectors_count": 0,
                "vector_dimension": self.vector_dim,
                "distance_metric": "Cosine",
                "is_connected": False,
                "error": str(e)
            }

qdrant_service = QdrantIntegration()
