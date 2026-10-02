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


class OutPassStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    USED = "used"
    RETURNED = "returned"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class OutPass(Base):
    __tablename__ = "out_passes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "students.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    destination: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    emergency_contact: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    departure_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    expected_return_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    status: Mapped[OutPassStatus] = mapped_column(
        SQLEnum(OutPassStatus),
        default=OutPassStatus.PENDING,
        nullable=False,
        index=True,
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    rejected_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    qr_token: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


class OutPassScanLog(Base):
    __tablename__ = "out_pass_scan_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    out_pass_id: Mapped[int] = mapped_column(
        ForeignKey(
            "out_passes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    scanned_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    scan_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    scanned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )