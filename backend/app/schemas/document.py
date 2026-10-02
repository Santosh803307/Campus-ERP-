from datetime import datetime

from pydantic import BaseModel


class StudentDocumentResponse(BaseModel):
    id: int
    student_id: int
    document_type: str
    title: str
    file_url: str
    file_name: str
    status: str
    issued_at: datetime
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class StudentDocumentListResponse(BaseModel):
    data: list[StudentDocumentResponse]
    total: int