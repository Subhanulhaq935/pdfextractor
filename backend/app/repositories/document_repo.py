import uuid
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentStatus


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Document | None:
        return (
            self.db.query(Document)
            .filter(Document.id == document_id, Document.user_id == user_id)
            .first()
        )

    def get_by_hash(self, user_id: uuid.UUID, file_hash: str) -> Document | None:
        return (
            self.db.query(Document)
            .filter(Document.user_id == user_id, Document.file_hash == file_hash)
            .first()
        )

    def list_by_user(self, user_id: uuid.UUID) -> list[Document]:
        return (
            self.db.query(Document)
            .filter(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .all()
        )

    def create(
        self,
        user_id: uuid.UUID,
        filename: str,
        stored_path: str,
        file_hash: str,
        file_size: int,
        page_count: int = 0,
        status: DocumentStatus = DocumentStatus.uploaded,
    ) -> Document:
        doc = Document(
            user_id=user_id,
            filename=filename,
            stored_path=stored_path,
            file_hash=file_hash,
            file_size=file_size,
            page_count=page_count,
            status=status,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update_status_and_pages(
        self, document: Document, status: DocumentStatus, page_count: int | None = None
    ) -> Document:
        document.status = status
        if page_count is not None:
            document.page_count = page_count
        self.db.commit()
        self.db.refresh(document)
        return document

    def delete(self, document: Document) -> None:
        self.db.delete(document)
        self.db.commit()
