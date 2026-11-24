from dataclasses import dataclass
from pathlib import Path
import fitz  # PyMuPDF


@dataclass
class ExtractedPage:
    page_number: int
    text: str


@dataclass
class PDFExtractionResult:
    page_count: int
    pages: list[ExtractedPage]
    warning: str | None = None


def extract_text_by_page(file_path: str | Path) -> PDFExtractionResult:
    """Extract non-empty text page by page using PyMuPDF (1-indexed page numbers)."""
    pages: list[ExtractedPage] = []
    with fitz.open(str(file_path)) as doc:
        total_pages = len(doc)
        for index, page in enumerate(doc, start=1):
            text = (page.get_text("text") or "").strip()
            if text:
                pages.append(ExtractedPage(page_number=index, text=text))

    warning = None
    if total_pages > 0 and not pages:
        warning = "No selectable text found. This PDF may be scanned or image-based."

    return PDFExtractionResult(page_count=total_pages, pages=pages, warning=warning)
