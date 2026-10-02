from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class FeeStructureCreate(BaseModel):
    department_id: int
    course: str = Field(min_length=2, max_length=100)
    semester: int = Field(ge=1, le=12)
    fee_type: str = Field(min_length=2, max_length=100)
    amount: Decimal = Field(gt=0)
    academic_year: str = Field(
        min_length=7,
        max_length=20,
    )


class FeeStructureUpdate(BaseModel):
    course: str | None = None
    semester: int | None = Field(
        default=None,
        ge=1,
        le=12,
    )
    fee_type: str | None = None
    amount: Decimal | None = Field(
        default=None,
        gt=0,
    )
    academic_year: str | None = None
    is_active: bool | None = None


class FeeStructureResponse(BaseModel):
    id: int
    department_id: int
    course: str
    semester: int
    fee_type: str
    amount: Decimal
    academic_year: str
    is_active: bool
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class StudentFeeCreate(BaseModel):
    student_id: int
    fee_structure_id: int
    amount: Decimal = Field(gt=0)
    due_date: datetime | None = None


class StudentFeeResponse(BaseModel):
    id: int
    student_id: int
    fee_structure_id: int
    amount: Decimal
    paid_amount: Decimal
    due_date: datetime | None
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }