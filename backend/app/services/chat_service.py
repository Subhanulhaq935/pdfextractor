import uuid
from sqlalchemy.orm import Session
from app.ai.rag_chain import RAGChain
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.conversation import Conversation
from app.models.document import DocumentStatus
from app.models.message import Message, MessageRole
from app.models.user import User
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.document_repo import DocumentRepository
from app.schemas.conversation import ConversationCreate


class ChatService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.doc_repo = DocumentRepository(db)

    def create_conversation(
        self, payload: ConversationCreate, current_user: User
    ) -> Conversation:
        doc = self.doc_repo.get_by_id(payload.document_id, current_user.id)
        if doc is None:
            raise NotFoundException("Document not found")

        if doc.status != DocumentStatus.ready:
            raise BadRequestException(
                f"Document is not ready for chat (current status: {doc.status.value})"
            )

        title = (payload.title or "New Conversation").strip() or "New Conversation"
        return self.conv_repo.create(
            user_id=current_user.id,
            document_id=doc.id,
            title=title,
        )

    def list_conversations(self, current_user: User) -> list[Conversation]:
        return self.conv_repo.list_by_user(current_user.id)

    def get_messages(
        self, conversation_id: uuid.UUID, current_user: User
    ) -> list[Message]:
        conv = self.conv_repo.get_by_id(conversation_id, current_user.id)
        if conv is None:
            raise NotFoundException("Conversation not found")
        return self.conv_repo.list_messages(conv.id)

    def ask_question(
        self, conversation_id: uuid.UUID, question: str, current_user: User
    ) -> Message:
        conv = self.conv_repo.get_by_id(conversation_id, current_user.id)
        if conv is None:
            raise NotFoundException("Conversation not found")

        doc = self.doc_repo.get_by_id(conv.document_id, current_user.id)
        if doc is None:
            raise NotFoundException("Document not found")
        if doc.status != DocumentStatus.ready:
            raise BadRequestException(
                f"Document is not ready for chat (current status: {doc.status.value})"
            )

        cleaned_question = question.strip()
        if not cleaned_question:
            raise BadRequestException("Question cannot be empty")

        history = self.conv_repo.get_recent_messages(conv.id, limit=6)

        if conv.title == "New Conversation" and not history:
            auto_title = cleaned_question[:80]
            if len(cleaned_question) > 80:
                auto_title += "..."
            self.conv_repo.update_title(conv, auto_title)

        self.conv_repo.add_message(
            conversation_id=conv.id,
            role=MessageRole.user,
            content=cleaned_question,
        )

        rag = RAGChain(self.db)
        result = rag.answer_question(
            question=cleaned_question,
            history=history,
            document_id=doc.id,
            user_id=current_user.id,
        )

        sources_payload = [s.model_dump() for s in result.sources] if result.sources else []
        assistant_msg = self.conv_repo.add_message(
            conversation_id=conv.id,
            role=MessageRole.assistant,
            content=result.answer,
            sources=sources_payload,
        )
        self.conv_repo.touch(conv)
        return assistant_msg
