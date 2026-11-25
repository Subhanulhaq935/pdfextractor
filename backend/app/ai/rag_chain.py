import logging
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from sqlalchemy.orm import Session
from app.ai.prompts import NOT_FOUND_ANSWER, QA_SYSTEM_PROMPT, REWRITE_QUESTION_PROMPT
from app.ai.retriever import Retriever
from app.ai.vector_store import RetrievedChunk
from app.core.config import get_settings
from app.core.exceptions import AppException
from app.models.message import Message, MessageRole
from app.schemas.message import SourceReference

logger = logging.getLogger(__name__)
FALLBACK_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
]


@dataclass
class RAGAnswer:
    answer: str
    sources: list[SourceReference]


class RAGChain:
    """Orchestrates follow-up rewriting, retrieval, and grounded answer generation using Gemini."""

    def __init__(self, db: Session | None = None) -> None:
        settings = get_settings()
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
            raise ValueError("GEMINI_API_KEY is not configured in .env")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.CHAT_MODEL
        self.retriever = Retriever(db) if db is not None else None

    def _generate(self, contents: str, system_instruction: str) -> str:
        """Call Gemini with automatic fallback across models if one is overloaded (503) or unavailable (404)."""
        models_to_try = [self.model] + [m for m in FALLBACK_MODELS if m != self.model]
        last_error: Exception | None = None

        for model_name in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0,
                    ),
                )
                return (response.text or "").strip()
            except genai_errors.APIError as exc:
                last_error = exc
                if exc.code in (404, 429, 503):
                    logger.warning("Model %s failed (%s); trying fallback", model_name, exc.code)
                    time.sleep(0.5)
                    continue
                raise

        raise AppException(
            status_code=503,
            detail="AI service is temporarily busy. Please try again in a moment.",
        ) from last_error

    def _rewrite_question(
        self, question: str, history_pairs: list[tuple[str, str]]
    ) -> str:
        if not history_pairs:
            return question

        history_lines = [f"{speaker}: {content}" for speaker, content in history_pairs]
        prompt = (
            "Conversation history:\n"
            + "\n".join(history_lines)
            + f"\n\nFollow-up question: {question}"
        )

        rewritten = self._generate(prompt, REWRITE_QUESTION_PROMPT)
        return rewritten or question

    def answer_with_retriever(
        self,
        question: str,
        history_pairs: list[tuple[str, str]],
        retrieve_fn: Callable[[str], list[RetrievedChunk]],
    ) -> RAGAnswer:
        """Shared RAG pipeline for both authenticated and guest sessions."""
        standalone_question = self._rewrite_question(question, history_pairs)
        chunks = retrieve_fn(standalone_question)

        if not chunks:
            return RAGAnswer(answer=NOT_FOUND_ANSWER, sources=[])

        context = "\n\n".join(
            f"[Page {chunk.page_number}]\n{chunk.content}" for chunk in chunks
        )
        system_prompt = QA_SYSTEM_PROMPT.format(context=context)
        answer_text = self._generate(standalone_question, system_prompt)

        if not answer_text or NOT_FOUND_ANSWER.lower() in answer_text.lower():
            return RAGAnswer(answer=NOT_FOUND_ANSWER, sources=[])

        seen_pages: set[int] = set()
        sources: list[SourceReference] = []
        for chunk in chunks:
            if chunk.page_number not in seen_pages:
                seen_pages.add(chunk.page_number)
                snippet = chunk.content[:200].replace("\n", " ").strip()
                if len(chunk.content) > 200:
                    snippet += "..."
                sources.append(SourceReference(page=chunk.page_number, snippet=snippet))

        return RAGAnswer(answer=answer_text, sources=sources)

    def answer_question(
        self,
        question: str,
        history: list[Message],
        document_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> RAGAnswer:
        if self.retriever is None:
            raise ValueError("Database session is required for persistent retrieval")

        history_pairs = [
            ("User" if msg.role == MessageRole.user else "Assistant", msg.content)
            for msg in history
        ]
        return self.answer_with_retriever(
            question=question,
            history_pairs=history_pairs,
            retrieve_fn=lambda q: self.retriever.retrieve(  # type: ignore[union-attr]
                query=q, document_id=document_id, user_id=user_id
            ),
        )
