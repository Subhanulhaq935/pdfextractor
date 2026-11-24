import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole


class ConversationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(
        self, conversation_id: uuid.UUID, user_id: uuid.UUID
    ) -> Conversation | None:
        return (
            self.db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            .first()
        )

    def list_by_user(self, user_id: uuid.UUID) -> list[Conversation]:
        return (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

    def create(
        self, user_id: uuid.UUID, document_id: uuid.UUID, title: str
    ) -> Conversation:
        conv = Conversation(
            user_id=user_id,
            document_id=document_id,
            title=title,
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def update_title(self, conversation: Conversation, title: str) -> Conversation:
        conversation.title = title
        conversation.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def touch(self, conversation: Conversation) -> None:
        conversation.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def list_messages(self, conversation_id: uuid.UUID) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )

    def get_recent_messages(
        self, conversation_id: uuid.UUID, limit: int = 6
    ) -> list[Message]:
        rows = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(rows))

    def add_message(
        self,
        conversation_id: uuid.UUID,
        role: MessageRole,
        content: str,
        sources: list[dict[str, Any]] | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            sources=sources,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
