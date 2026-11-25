import math
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
import fitz  # PyMuPDF
from fastapi import UploadFile
from app.ai.chunker import TextChunk, chunk_pages
from app.ai.embeddings import EmbeddingService
from app.ai.pdf_extractor import ExtractedPage
from app.ai.rag_chain import RAGChain
from app.ai.vector_store import RetrievedChunk
from app.core.config import get_settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.schemas.guest import GuestAskRequest, GuestAskResponse, GuestUploadResponse

ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}
PDF_MAGIC_BYTES = b"%PDF"
GUEST_TTL_SECONDS = 2 * 60 * 60
MAX_GUEST_DOCS = 50


@dataclass
class _GuestDocument:
    filename: str
    chunks: list[TextChunk]
    embeddings: list[list[float]]
    created_at: float


_GUEST_DOCS: dict[str, _GuestDocument] = {}


def _cleanup_expired() -> None:
    now = time.time()
    expired = [k for k, v in _GUEST_DOCS.items() if now - v.created_at > GUEST_TTL_SECONDS]
    for key in expired:
        _GUEST_DOCS.pop(key, None)

    while len(_GUEST_DOCS) >= MAX_GUEST_DOCS:
        oldest_key = next(iter(_GUEST_DOCS))
        _GUEST_DOCS.pop(oldest_key, None)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class GuestService:
    """Ephemeral PDF upload and Q&A for guest users without saving chats to DB."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def upload_pdf(self, file: UploadFile) -> GuestUploadResponse:
        filename = (file.filename or "").strip()
        if not filename.lower().endswith(".pdf"):
            raise BadRequestException("Only .pdf files are allowed")

        if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
            raise BadRequestException("Invalid MIME type; expected application/pdf")

        content = await file.read()
        if not content:
            raise BadRequestException("Uploaded file is empty")

        if len(content) > self.settings.max_upload_bytes:
            raise BadRequestException(
                f"File exceeds maximum size of {self.settings.MAX_UPLOAD_MB} MB"
            )

        if not content.startswith(PDF_MAGIC_BYTES):
            raise BadRequestException("Invalid PDF file signature")

        pages: list[ExtractedPage] = []
        try:
            with fitz.open(stream=content, filetype="pdf") as doc:
                page_count = len(doc)
                for idx, page in enumerate(doc, start=1):
                    text = (page.get_text("text") or "").strip()
                    if text:
                        pages.append(ExtractedPage(page_number=idx, text=text))
        except Exception as exc:
            raise BadRequestException("Failed to parse PDF document") from exc

        if not pages:
            raise BadRequestException(
                "No selectable text found. This PDF may be scanned or image-based."
            )

        chunks = chunk_pages(pages, chunk_size=1000, chunk_overlap=150)
        if not chunks:
            raise BadRequestException("Could not extract text chunks from PDF")

        embeddings = EmbeddingService().embed_texts([c.content for c in chunks], batch_size=100)

        _cleanup_expired()
        guest_doc_id = str(uuid.uuid4())
        _GUEST_DOCS[guest_doc_id] = _GuestDocument(
            filename=Path(filename).name,
            chunks=chunks,
            embeddings=embeddings,
            created_at=time.time(),
        )

        return GuestUploadResponse(
            guest_doc_id=guest_doc_id,
            filename=Path(filename).name,
            file_size=len(content),
            page_count=page_count,
        )

    def ask_question(self, payload: GuestAskRequest) -> GuestAskResponse:
        _cleanup_expired()
        guest_doc = _GUEST_DOCS.get(payload.guest_doc_id)
        if guest_doc is None:
            raise NotFoundException(
                "Guest PDF session expired or not found. Please upload the PDF again."
            )

        cleaned_question = payload.question.strip()
        if not cleaned_question:
            raise BadRequestException("Question cannot be empty")

        embedding_service = EmbeddingService()
        top_k = self.settings.TOP_K_CHUNKS
        min_sim = self.settings.SIMILARITY_THRESHOLD

        def retrieve_in_memory(query: str) -> list[RetrievedChunk]:
            q_emb = embedding_service.embed_query(query)
            scored = [
                RetrievedChunk(
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    similarity=_cosine_similarity(q_emb, emb),
                )
                for chunk, emb in zip(guest_doc.chunks, guest_doc.embeddings, strict=True)
            ]
            scored.sort(key=lambda c: c.similarity, reverse=True)
            candidates = scored[:top_k]
            if not candidates or candidates[0].similarity < min_sim:
                return []
            return [c for c in candidates if c.similarity >= min_sim]

        history_pairs = [
            ("User" if h.role == "user" else "Assistant", h.content)
            for h in payload.history[-6:]
        ]

        rag = RAGChain(db=None)
        result = rag.answer_with_retriever(
            question=cleaned_question,
            history_pairs=history_pairs,
            retrieve_fn=retrieve_in_memory,
        )
        return GuestAskResponse(answer=result.answer, sources=result.sources)

    def delete_document(self, guest_doc_id: str) -> None:
        _GUEST_DOCS.pop(guest_doc_id, None)
