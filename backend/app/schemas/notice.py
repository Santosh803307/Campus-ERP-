from datetime import datetime

from pydantic import BaseModel, Field


class CollegeNoticeCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        min_length=5,
    )

    category: str = Field(
        min_length=2,
        max_length=50,
    )

    priority: str = Field(
        default="normal",
        max_length=30,
    )

    department: str = Field(
        min_length=2,
        max_length=150,
    )


class CollegeNoticeUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        min_length=5,
    )

    category: str | None = Field(
        default=None,
        max_length=50,
    )

    priority: str | None = Field(
        default=None,
        max_length=30,
    )

    department: str | None = Field(
        default=None,
        max_length=150,
    )


class CollegeNoticeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    department: str
    published_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CollegeNoticeListResponse(BaseModel):
    data: list[CollegeNoticeResponse]
    total: int