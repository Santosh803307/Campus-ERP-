from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FacultyBase(BaseModel):
    user_id: int = Field(gt=0)
    department_id: int = Field(gt=0)

    employee_id: str = Field(
        min_length=1,
        max_length=50,
    )

    designation: str = Field(
        min_length=1,
        max_length=100,
    )

    qualification: str | None = Field(
        default=None,
        max_length=255,
    )

    specialization: str | None = Field(
        default=None,
        max_length=255,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    joining_date: datetime | None = None


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    employee_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    designation: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    qualification: str | None = Field(
        default=None,
        max_length=255,
    )

    specialization: str | None = Field(
        default=None,
        max_length=255,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    joining_date: datetime | None = None

    is_active: bool | None = None


class FacultyResponse(FacultyBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )