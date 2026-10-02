from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class OutPassCreateRequest(BaseModel):
    reason: str = Field(
        min_length=3,
        max_length=500,
    )

    destination: str = Field(
        min_length=2,
        max_length=255,
    )

    emergency_contact: str = Field(
        min_length=10,
        max_length=20,
    )

    departure_time: datetime

    expected_return_time: datetime


class OutPassResponse(BaseModel):
    id: int
    student_id: int
    reason: str
    destination: str
    emergency_contact: str
    departure_time: datetime
    expected_return_time: datetime
    status: str
    approved_by: int | None
    approved_at: datetime | None
    rejected_reason: str | None
    qr_token: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class OutPassApprovalRequest(BaseModel):
    status: Literal["approved", "rejected"]
    remarks: str | None = Field(
        default=None,
        max_length=500,
    )


class OutPassScanRequest(BaseModel):
    qr_token: str = Field(
        min_length=10,
        max_length=255,
    )

    scan_type: Literal["exit", "entry"]


class OutPassScanResponse(BaseModel):
    success: bool
    message: str
    out_pass_id: int
    scan_type: str
    scanned_at: datetime


class OutPassScanLogResponse(BaseModel):
    id: int
    out_pass_id: int
    scanned_by: int | None
    scan_type: str
    scanned_at: datetime
    remarks: str | None

    model_config = {
        "from_attributes": True,
    }
    # =========================================================
# STUDENT VERIFICATION
# =========================================================

class OutPassStudentInfo(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    enrollment_no: str
    course: str
    semester: int
    department_id: int


class OutPassLatestScan(BaseModel):
    scan_type: str
    scanned_at: datetime
    scanned_by: int | None
    remarks: str | None


class OutPassVerificationResponse(BaseModel):
    out_pass_id: int
    status: str

    reason: str
    destination: str
    emergency_contact: str

    departure_time: datetime
    expected_return_time: datetime

    approved_by: int | None
    approved_at: datetime | None

    student: OutPassStudentInfo

    latest_scan: OutPassLatestScan | None