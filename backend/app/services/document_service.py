import hashlib
import logging
import uuid
from pathlib import Path
from fastapi import BackgroundTasks, UploadFile
from sqlalchemy.orm import Session
from app.ai.chunker import chunk_pages
from app.ai.embeddings import EmbeddingService
from app.ai.pdf_extractor import extract_text_by_page
from app.ai.vector_store import VectorStore
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.repositories.document_repo import DocumentRepository
from app.schemas.document import DocumentDetailResponse, PageText

logger = logging.getLogger(__name__)
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}
PDF_MAGIC_BYTES = b"%PDF"


def process_document_background(document_id: uuid.UUID) -> None:
    """Extract PDF text, chunk it, generate embeddings, and store in pgvector."""
    db = SessionLocal()
    try:
        repo = DocumentRepository(db)
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc is None:
            return

        extraction = extract_text_by_page(doc.stored_path)
        if not extraction.pages:
            repo.update_status_and_pages(
                doc, status=DocumentStatus.failed, page_count=extraction.page_count
            )
            logger.warning("Document %s has no extractable text", document_id)
            return

        chunks = chunk_pages(extraction.pages, chunk_size=1000, chunk_overlap=150)
        if not chunks:
            repo.update_status_and_pages(
                doc, status=DocumentStatus.failed, page_count=extraction.page_count
            )
            return

        embedding_service = EmbeddingService()
        embeddings = embedding_service.embed_texts([c.content for c in chunks], batch_size=100)

        vector_store = VectorStore(db)
        vector_store.delete_by_document(doc.id, doc.user_id)
        vector_store.add_chunks(doc.id, doc.user_id, chunks, embeddings)

        repo.update_status_and_pages(
            doc, status=DocumentStatus.ready, page_count=extraction.page_count
        )
    except Exception:
        logger.exception("Background ingestion failed for document %s", document_id)
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc is not None:
            DocumentRepository(db).update_status_and_pages(doc, status=DocumentStatus.failed)
    finally:
        db.close()


class DocumentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = DocumentRepository(db)
        self.settings = get_settings()

    async def upload_pdf(
        self, file: UploadFile, current_user: User, background_tasks: BackgroundTasks
    ) -> Document:
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

        file_hash = hashlib.sha256(content).hexdigest()
        existing = self.repo.get_by_hash(current_user.id, file_hash)
        if existing is not None:
            if existing.status == DocumentStatus.failed:
                self.repo.update_status_and_pages(existing, status=DocumentStatus.processing)
                background_tasks.add_task(process_document_background, existing.id)
            return existing

        safe_name = f"{uuid.uuid4()}.pdf"
        stored_path = self.settings.upload_path / safe_name
        stored_path.write_bytes(content)

        doc = self.repo.create(
            user_id=current_user.id,
            filename=Path(filename).name,
            stored_path=str(stored_path),
            file_hash=file_hash,
            file_size=len(content),
            page_count=0,
            status=DocumentStatus.processing,
        )

        background_tasks.add_task(process_document_background, doc.id)
        return doc

    def list_documents(self, current_user: User) -> list[Document]:
        return self.repo.list_by_user(current_user.id)

    def get_document_detail(
        self, document_id: uuid.UUID, current_user: User
    ) -> DocumentDetailResponse:
        doc = self.repo.get_by_id(document_id, current_user.id)
        if doc is None:
            raise NotFoundException("Document not found")

        extracted_pages: list[PageText] = []
        warning: str | None = None

        stored = Path(doc.stored_path)
        if stored.exists():
            result = extract_text_by_page(stored)
            extracted_pages = [
                PageText(page_number=p.page_number, text=p.text) for p in result.pages
            ]
            warning = result.warning

        return DocumentDetailResponse(
            id=doc.id,
            filename=doc.filename,
            file_size=doc.file_size,
            page_count=doc.page_count,
            status=doc.status,
            created_at=doc.created_at,
            extracted_pages=extracted_pages,
            warning=warning,
        )

    def delete_document(self, document_id: uuid.UUID, current_user: User) -> None:
        doc = self.repo.get_by_id(document_id, current_user.id)
        if doc is None:
            raise NotFoundException("Document not found")

        VectorStore(self.db).delete_by_document(doc.id, current_user.id)

        stored = Path(doc.stored_path)
        if stored.exists():
            stored.unlink()

        self.repo.delete(doc)
