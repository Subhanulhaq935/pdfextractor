import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    document_id: uuid.UUID
    title: str | None = Field(default=None, max_length=255)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
