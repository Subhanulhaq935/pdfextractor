import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.message import MessageRole


class SourceReference(BaseModel):
    page: int
    snippet: str


class MessageCreate(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    sources: list[SourceReference] | None = None
    created_at: datetime
