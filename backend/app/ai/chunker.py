from dataclasses import dataclass
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.ai.pdf_extractor import ExtractedPage


@dataclass
class TextChunk:
    page_number: int
    chunk_index: int
    content: str


def chunk_pages(
    pages: list[ExtractedPage],
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[TextChunk]:
    """Split extracted pages into overlapping chunks while preserving page numbers."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: list[TextChunk] = []
    chunk_index = 0
    for page in pages:
        split_texts = splitter.split_text(page.text)
        for text in split_texts:
            cleaned = text.strip()
            if not cleaned:
                continue
            chunks.append(
                TextChunk(
                    page_number=page.page_number,
                    chunk_index=chunk_index,
                    content=cleaned,
                )
            )
            chunk_index += 1

    return chunks
