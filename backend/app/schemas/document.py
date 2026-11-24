import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentStatus


class PageText(BaseModel):
    page_number: int
    text: str


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    file_size: int
    page_count: int
    status: DocumentStatus
    created_at: datetime


class DocumentDetailResponse(DocumentResponse):
    extracted_pages: list[PageText] = []
    warning: str | None = None
