import uuid
from sqlalchemy.orm import Session
from app.ai.embeddings import EmbeddingService
from app.ai.vector_store import RetrievedChunk, VectorStore
from app.core.config import get_settings


class Retriever:
    """Retrieve relevant document chunks filtered by user and document with a similarity threshold."""

    def __init__(self, db: Session) -> None:
        self.settings = get_settings()
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore(db)

    def retrieve(
        self,
        query: str,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        top_k: int | None = None,
        threshold: float | None = None,
    ) -> list[RetrievedChunk]:
        k = top_k or self.settings.TOP_K_CHUNKS
        min_similarity = threshold if threshold is not None else self.settings.SIMILARITY_THRESHOLD

        query_embedding = self.embedding_service.embed_query(query)
        candidates = self.vector_store.similarity_search(
            query_embedding=query_embedding,
            document_id=document_id,
            user_id=user_id,
            top_k=k,
        )
        if not candidates or candidates[0].similarity < min_similarity:
            return []

        return [c for c in candidates if c.similarity >= min_similarity]
