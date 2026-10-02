from datetime import datetime

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    code: str = Field(
        min_length=2,
        max_length=20
    )

    description: str | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=20
    )

    description: str | None = None

    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }