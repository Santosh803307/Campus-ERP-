from datetime import datetime

from pydantic import BaseModel, Field


# ============================================================
# STUDENT - APPLY FOR NO-DUES
# ============================================================

class NoDuesApplyRequest(BaseModel):
    reason: str | None = Field(
        default=None,
        max_length=500,
    )


# ============================================================
# DEPARTMENT - APPROVE / REJECT
# ============================================================

class NoDuesApprovalRequest(BaseModel):
    status: str
    remarks: str | None = Field(
        default=None,
        max_length=500,
    )


# ============================================================
# APPROVAL RESPONSE
# ============================================================

class NoDuesApprovalResponse(BaseModel):
    id: int
    no_dues_request_id: int
    department: str
    status: str
    remarks: str | None
    approved_by: int | None
    approved_at: datetime | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# ============================================================
# NO-DUES REQUEST RESPONSE
# ============================================================

class NoDuesResponse(BaseModel):
    id: int
    student_id: int
    status: str
    reason: str | None
    applied_at: datetime
    completed_at: datetime | None

    model_config = {
        "from_attributes": True
    }