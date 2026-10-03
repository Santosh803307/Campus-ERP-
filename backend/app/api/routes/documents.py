from io import BytesIO
from pathlib import Path
from uuid import uuid4

import cloudinary.exceptions
from cloudinary import uploader
import httpx

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import cloudinary as cloudinary_config
from app.core.database import get_db
from app.core.security import require_roles
from app.models.document import StudentDocument
from app.models.student import Student
from app.models.user import User
from app.schemas.document import (
    StudentDocumentListResponse,
    StudentDocumentResponse,
)


router = APIRouter(
    prefix="/api/documents",
    tags=["Student Documents"],
)


# =========================================================
# CONFIGURATION
# =========================================================

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

CLOUDINARY_FOLDER = "campus_erp/documents"


# =========================================================
# HELPER — FETCH PDF FROM CLOUDINARY
# =========================================================

async def fetch_cloudinary_pdf(
    document: StudentDocument,
) -> StreamingResponse:
    """
    Fetch a PDF from Cloudinary on the backend and return it
    to the authenticated frontend.

    The Cloudinary URL is never directly exposed to the
    browser through a redirect.
    """

    if not document.file_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file URL not found",
        )

    try:
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = await client.get(
                document.file_url
            )

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to retrieve document "
                f"from Cloudinary: {error}"
            ),
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cloudinary document could not be retrieved",
        )

    content_type = response.headers.get(
        "content-type",
        "application/pdf",
    )

    return StreamingResponse(
        BytesIO(response.content),
        media_type=content_type,
        headers={
            "Content-Disposition": (
                f'inline; filename="{document.file_name}"'
            ),
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


# =========================================================
# STUDENT — MY DOCUMENTS
# =========================================================

@router.get(
    "/me",
    response_model=StudentDocumentListResponse,
)
def get_my_documents(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    documents = db.scalars(
        select(StudentDocument)
        .where(
            StudentDocument.student_id == student.id
        )
        .order_by(
            StudentDocument.issued_at.desc()
        )
    ).all()

    return {
        "data": documents,
        "total": len(documents),
    }


# =========================================================
# ADMIN / FACULTY / HOD — ALL DOCUMENTS
# =========================================================

@router.get(
    "/",
    response_model=StudentDocumentListResponse,
)
def get_all_documents(
    student_id: int | None = None,
    document_type: str | None = None,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    query = select(StudentDocument)

    if student_id is not None:
        query = query.where(
            StudentDocument.student_id == student_id
        )

    if document_type:
        query = query.where(
            StudentDocument.document_type.ilike(
                document_type.strip()
            )
        )

    query = query.order_by(
        StudentDocument.issued_at.desc()
    )

    documents = db.scalars(query).all()

    return {
        "data": documents,
        "total": len(documents),
    }


# =========================================================
# ADMIN — VIEW DOCUMENT
# =========================================================

@router.get(
    "/admin/{document_id}/file",
)
async def download_admin_document(
    document_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    document = db.get(
        StudentDocument,
        document_id,
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if not document.file_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file URL not found",
        )

    # -----------------------------------------------------
    # Cloudinary document
    # -----------------------------------------------------

    if document.cloudinary_public_id:
        return await fetch_cloudinary_pdf(
            document
        )

    # -----------------------------------------------------
    # Old local-storage document
    # -----------------------------------------------------

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Document file is no longer available",
    )


# =========================================================
# ADMIN — DELETE DOCUMENT
# =========================================================

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    document = db.get(
        StudentDocument,
        document_id,
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # -----------------------------------------------------
    # Delete from Cloudinary
    # -----------------------------------------------------

    if document.cloudinary_public_id:
        try:
            uploader.destroy(
                document.cloudinary_public_id,
                resource_type="raw",
                type="upload",
                invalidate=True,
            )

        except cloudinary.exceptions.Error as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Unable to delete document from "
                    f"Cloudinary: {error}"
                ),
            )

    # -----------------------------------------------------
    # Delete database record
    # -----------------------------------------------------

    db.delete(document)
    db.commit()

    return None


# =========================================================
# ADMIN — CREATE DOCUMENT RECORD
# =========================================================

@router.post(
    "/",
    response_model=StudentDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    student_id: int,
    document_type: str,
    title: str,
    file_url: str,
    file_name: str,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    student = db.get(
        Student,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    document = StudentDocument(
        student_id=student_id,
        document_type=document_type.strip().lower(),
        title=title.strip(),
        file_url=file_url.strip(),
        file_name=file_name.strip(),
        status="available",
    )

    db.add(document)

    try:
        db.commit()
        db.refresh(document)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document could not be created",
        )

    return document


# =========================================================
# ADMIN — UPLOAD DOCUMENT
# =========================================================

@router.post(
    "/upload",
    response_model=StudentDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    student_id: int = Form(...),
    document_type: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Validate student
    # -----------------------------------------------------

    student = db.get(
        Student,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # -----------------------------------------------------
    # Validate document information
    # -----------------------------------------------------

    clean_type = document_type.strip().lower()
    clean_title = title.strip()

    if not clean_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document type is required",
        )

    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document title is required",
        )

    # -----------------------------------------------------
    # Validate file
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required",
        )

    original_filename = Path(
        file.filename
    ).name

    extension = Path(
        original_filename
    ).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    # -----------------------------------------------------
    # Read file
    # -----------------------------------------------------

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size must not exceed 5 MB",
        )

    # -----------------------------------------------------
    # Validate PDF signature
    # -----------------------------------------------------

    if not contents.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file",
        )

    # -----------------------------------------------------
    # Generate Cloudinary Public ID
    # -----------------------------------------------------

    public_id = (
        f"{CLOUDINARY_FOLDER}/"
        f"{uuid4().hex}.pdf"
    )

    # -----------------------------------------------------
    # Upload to Cloudinary
    # -----------------------------------------------------

    try:
        upload_result = uploader.upload(
            BytesIO(contents),
            resource_type="raw",
            public_id=public_id,
            overwrite=False,
        )

    except cloudinary.exceptions.Error as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to upload document to "
                f"Cloudinary: {error}"
            ),
        )

    # -----------------------------------------------------
    # Get Cloudinary response
    # -----------------------------------------------------

    cloudinary_url = upload_result.get(
        "secure_url"
    )

    uploaded_public_id = upload_result.get(
        "public_id"
    )

    if (
        not cloudinary_url
        or not uploaded_public_id
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cloudinary upload failed",
        )

    # -----------------------------------------------------
    # Create database record
    # -----------------------------------------------------

    document = StudentDocument(
        student_id=student_id,
        document_type=clean_type,
        title=clean_title,
        file_url=cloudinary_url,
        cloudinary_public_id=uploaded_public_id,
        file_name=original_filename,
        status="available",
    )

    db.add(document)

    try:
        db.commit()
        db.refresh(document)

    except IntegrityError:
        db.rollback()

        # -------------------------------------------------
        # Roll back Cloudinary upload if DB fails
        # -------------------------------------------------

        try:
            uploader.destroy(
                uploaded_public_id,
                resource_type="raw",
                type="upload",
                invalidate=True,
            )

        except cloudinary.exceptions.Error:
            pass

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document could not be created",
        )

    return document


# =========================================================
# STUDENT — DOCUMENT DETAILS
# =========================================================

@router.get(
    "/{document_id}",
    response_model=StudentDocumentResponse,
)
def get_my_document(
    document_id: int,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    document = db.scalar(
        select(StudentDocument).where(
            StudentDocument.id == document_id,
            StudentDocument.student_id == student.id,
        )
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


# =========================================================
# STUDENT — VIEW / DOWNLOAD DOCUMENT
# =========================================================

@router.get(
    "/{document_id}/file",
)
async def download_my_document(
    document_id: int,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    document = db.scalar(
        select(StudentDocument).where(
            StudentDocument.id == document_id,
            StudentDocument.student_id == student.id,
        )
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if not document.file_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file URL not found",
        )

    # -----------------------------------------------------
    # Cloudinary document
    # -----------------------------------------------------

    if document.cloudinary_public_id:
        return await fetch_cloudinary_pdf(
            document
        )

    # -----------------------------------------------------
    # Old local-storage document
    # -----------------------------------------------------

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Document file is no longer available",
    )