from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    subject_code: str
    date: date
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AttendanceListResponse(BaseModel):
    data: list[AttendanceResponse]
    total: int


class AttendanceCreate(BaseModel):
    student_id: int = Field(gt=0)

    subject: str = Field(
        min_length=2,
        max_length=100,
    )

    subject_code: str = Field(
        min_length=2,
        max_length=30,
    )

    date: date

    status: str = Field(
        min_length=1,
        max_length=10,
    )