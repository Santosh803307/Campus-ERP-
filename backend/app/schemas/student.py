from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    department_id: int = Field(gt=0)

    enrollment_no: str = Field(
        min_length=2,
        max_length=50,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    course: str = Field(
        min_length=2,
        max_length=100,
    )

    semester: int = Field(
        ge=1,
        le=12,
    )

    section: str | None = Field(
        default=None,
        max_length=20,
    )

    admission_year: int = Field(
        ge=2000,
        le=2100,
    )


class StudentUpdate(BaseModel):
    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    enrollment_no: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    course: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    semester: int | None = Field(
        default=None,
        ge=1,
        le=12,
    )

    section: str | None = Field(
        default=None,
        max_length=20,
    )

    admission_year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
    )

    is_active: bool | None = None


class StudentResponse(BaseModel):
    id: int
    user_id: int
    department_id: int
    enrollment_no: str
    course: str
    semester: int
    section: str | None
    admission_year: int
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class StudentPagination(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class StudentListResponse(BaseModel):
    data: list[StudentResponse]
    pagination: StudentPagination