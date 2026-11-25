from fastapi import APIRouter, File, UploadFile, status
from app.schemas.guest import GuestAskRequest, GuestAskResponse, GuestUploadResponse
from app.services.guest_service import GuestService

router = APIRouter(prefix="/guest", tags=["Guest (No Login)"])


@router.post("/upload", response_model=GuestUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_guest_pdf(file: UploadFile = File(...)) -> GuestUploadResponse:
    return await GuestService().upload_pdf(file)


@router.post("/ask", response_model=GuestAskResponse)
def ask_guest_question(payload: GuestAskRequest) -> GuestAskResponse:
    return GuestService().ask_question(payload)


@router.delete("/documents/{guest_doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guest_pdf(guest_doc_id: str) -> None:
    GuestService().delete_document(guest_doc_id)
