from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# =========================================================
# CREATE RESULT
# =========================================================

class ExamResultCreate(BaseModel):
    exam_id: int = Field(gt=0)
    student_id: int = Field(gt=0)

    marks_obtained: Decimal = Field(
        ge=0,
        decimal_places=2,
        max_digits=6,
    )

    max_marks: Decimal = Field(
        gt=0,
        decimal_places=2,
        max_digits=6,
    )

    remarks: str | None = Field(
        default=None,
        max_length=255,
    )


# =========================================================
# UPDATE RESULT
# =========================================================

class ExamResultUpdate(BaseModel):
    marks_obtained: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
        max_digits=6,
    )

    max_marks: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
        max_digits=6,
    )

    remarks: str | None = Field(
        default=None,
        max_length=255,
    )


# =========================================================
# BASIC RESULT RESPONSE
# Used by ADMIN / FACULTY / HOD
# =========================================================

class ExamResultResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int

    marks_obtained: Decimal
    max_marks: Decimal

    grade: str
    result_status: str

    remarks: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# =========================================================
# STUDENT RESULT RESPONSE
# Includes actual examination details
# =========================================================

class StudentExamResultResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int

    subject: str
    subject_code: str
    exam_type: str
    exam_date: date
    start_time: str
    end_time: str
    room: str

    marks_obtained: Decimal
    max_marks: Decimal

    grade: str
    result_status: str

    remarks: str | None
    created_at: datetime
    updated_at: datetime


# =========================================================
# BASIC RESULT LIST
# =========================================================

class ExamResultListResponse(BaseModel):
    data: list[ExamResultResponse]
    total: int


# =========================================================
# STUDENT RESULT LIST
# =========================================================

class StudentExamResultListResponse(BaseModel):
    data: list[StudentExamResultResponse]
    total: int