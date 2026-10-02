from datetime import datetime

from pydantic import BaseModel, Field


class SupportTicketCreate(BaseModel):
    department: str = Field(
        min_length=2,
        max_length=100,
    )

    category: str = Field(
        min_length=2,
        max_length=50,
    )

    description: str = Field(
        min_length=10,
        max_length=5000,
    )


class SupportTicketResponse(BaseModel):
    id: int
    student_id: int
    department: str
    category: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class SupportTicketListResponse(BaseModel):
    data: list[SupportTicketResponse]
    total: int