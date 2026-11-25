from pydantic import BaseModel, Field
from app.schemas.message import SourceReference


class GuestUploadResponse(BaseModel):
    guest_doc_id: str
    filename: str
    file_size: int
    page_count: int


class GuestHistoryItem(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class GuestAskRequest(BaseModel):
    guest_doc_id: str
    question: str = Field(min_length=1, max_length=4000)
    history: list[GuestHistoryItem] = Field(default_factory=list, max_length=6)


class GuestAskResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
