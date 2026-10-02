from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NoDuesStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class NoDuesDepartment(str, Enum):
    LIBRARY = "library"
    ACCOUNTS = "accounts"
    HOSTEL = "hostel"
    LAB = "lab"
    DEPARTMENT = "department"


class NoDuesRequest(Base):
    __tablename__ = "no_dues_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[NoDuesStatus] = mapped_column(
        SQLEnum(NoDuesStatus),
        default=NoDuesStatus.PENDING,
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    applied_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )


class NoDuesApproval(Base):
    __tablename__ = "no_dues_approvals"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    no_dues_request_id: Mapped[int] = mapped_column(
        ForeignKey(
            "no_dues_requests.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    department: Mapped[NoDuesDepartment] = mapped_column(
        SQLEnum(NoDuesDepartment),
        nullable=False,
    )

    status: Mapped[NoDuesStatus] = mapped_column(
        SQLEnum(NoDuesStatus),
        default=NoDuesStatus.PENDING,
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )