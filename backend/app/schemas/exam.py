from datetime import date, time, datetime

from pydantic import BaseModel, Field


class ExamCreate(BaseModel):
    subject: str = Field(
        min_length=2,
        max_length=100,
    )

    subject_code: str = Field(
        min_length=2,
        max_length=30,
    )

    exam_type: str = Field(
        min_length=2,
        max_length=30,
    )

    exam_date: date

    start_time: time

    end_time: time

    room: str = Field(
        min_length=1,
        max_length=100,
    )

    semester: int = Field(
        ge=1,
        le=12,
    )

    course: str = Field(
        min_length=2,
        max_length=100,
    )


class ExamUpdate(BaseModel):
    subject: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    subject_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    exam_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    exam_date: date | None = None

    start_time: time | None = None

    end_time: time | None = None

    room: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    semester: int | None = Field(
        default=None,
        ge=1,
        le=12,
    )

    course: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )


class ExamResponse(BaseModel):
    id: int
    subject: str
    subject_code: str
    exam_type: str
    exam_date: date
    start_time: time
    end_time: time
    room: str
    semester: int
    course: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class ExamListResponse(BaseModel):
    data: list[ExamResponse]
    total: int