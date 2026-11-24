import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/conversations", tags=["Chat"])


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Message]:
    return ChatService(db).get_messages(conversation_id, current_user)


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def ask_question(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Message:
    return ChatService(db).ask_question(conversation_id, payload.question, current_user)
