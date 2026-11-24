import uuid
from dataclasses import dataclass
from sqlalchemy.orm import Session
from app.ai.chunker import TextChunk
from app.models.chunk import DocumentChunk


@dataclass
class RetrievedChunk:
    page_number: int
    chunk_index: int
    content: str
    similarity: float


class VectorStore:
    """pgvector-backed storage and similarity search for document chunks."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def add_chunks(
        self,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        chunks: list[TextChunk],
        embeddings: list[list[float]],
    ) -> None:
        """Persist chunks and their embeddings in PostgreSQL."""
        records = [
            DocumentChunk(
                document_id=document_id,
                user_id=user_id,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                embedding=embedding,
            )
            for chunk, embedding in zip(chunks, embeddings, strict=True)
        ]
        self.db.add_all(records)
        self.db.commit()

    def delete_by_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Remove all chunks for a user's document."""
        (
            self.db.query(DocumentChunk)
            .filter(
                DocumentChunk.document_id == document_id,
                DocumentChunk.user_id == user_id,
            )
            .delete(synchronize_session=False)
        )
        self.db.commit()

    def similarity_search(
        self,
        query_embedding: list[float],
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        top_k: int = 5,
    ) -> list[RetrievedChunk]:
        """Find top-k most similar chunks using cosine distance filtered by user and document."""
        distance_expr = DocumentChunk.embedding.cosine_distance(query_embedding)
        rows = (
            self.db.query(DocumentChunk, distance_expr.label("distance"))
            .filter(
                DocumentChunk.document_id == document_id,
                DocumentChunk.user_id == user_id,
            )
            .order_by(distance_expr)
            .limit(top_k)
            .all()
        )
        return [
            RetrievedChunk(
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                similarity=1.0 - float(distance),
            )
            for chunk, distance in rows
        ]
