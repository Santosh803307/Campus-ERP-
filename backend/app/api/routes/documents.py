from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

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
# FILE STORAGE
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]

UPLOAD_DIR = (
    BASE_DIR
    / "uploads"
    / "documents"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


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
# ADMIN — ALL DOCUMENTS
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

@router.get(
    "/admin/{document_id}/file",
)
def download_admin_document(
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

    stored_filename = (
        Path(document.file_url).name
        if document.file_url
        else ""
    )

    file_path = (
        UPLOAD_DIR
        / stored_filename
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=document.file_name,
    )

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

    stored_filename = (
        Path(document.file_url).name
        if document.file_url
        else ""
    )

    file_path = (
        UPLOAD_DIR
        / stored_filename
    )

    db.delete(document)
    db.commit()

    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        pass

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
    # Basic PDF signature validation
    # -----------------------------------------------------

    if not contents.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file",
        )

    # -----------------------------------------------------
    # Generate safe unique filename
    # -----------------------------------------------------

    stored_filename = (
        f"{uuid4().hex}.pdf"
    )

    file_path = (
        UPLOAD_DIR
        / stored_filename
    )

    # -----------------------------------------------------
    # Save file
    # -----------------------------------------------------

    try:
        file_path.write_bytes(contents)

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save uploaded file",
        )

    # -----------------------------------------------------
    # Create database record
    # -----------------------------------------------------

    document = StudentDocument(
        student_id=student_id,
        document_type=clean_type,
        title=clean_title,
        file_url=stored_filename,
        file_name=original_filename,
        status="available",
    )

    db.add(document)

    try:
        db.commit()
        db.refresh(document)

    except IntegrityError:
        db.rollback()

        # Remove uploaded file if DB operation fails
        try:
            file_path.unlink(
                missing_ok=True
            )
        except OSError:
            pass

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document could not be created",
        )

    return document

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
def download_my_document(
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

    stored_filename = (
        Path(document.file_url).name
        if document.file_url
        else ""
    )

    file_path = (
        UPLOAD_DIR
        / stored_filename
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=document.file_name,
    )