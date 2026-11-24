from google import genai
from google.genai import types
from app.core.config import get_settings


class EmbeddingService:
    """Create 1536-dim vector embeddings in batches using Google Gemini API."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
            raise ValueError("GEMINI_API_KEY is not configured in .env")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.EMBEDDING_MODEL

    def embed_texts(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        """Embed document chunks in batches and return 1536-dim vectors."""
        embeddings: list[list[float]] = []
        config = types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=1536,
        )
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self.client.models.embed_content(
                model=self.model,
                contents=batch,
                config=config,
            )
            embeddings.extend([list(item.values) for item in response.embeddings])
        return embeddings

    def embed_query(self, query: str) -> list[float]:
        """Embed a single search query."""
        config = types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=1536,
        )
        response = self.client.models.embed_content(
            model=self.model,
            contents=query,
            config=config,
        )
        return list(response.embeddings[0].values)
