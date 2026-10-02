from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ExamResult(Base):
    __tablename__ = "exam_results"

    __table_args__ = (
        UniqueConstraint(
            "exam_id",
            "student_id",
            name="uq_exam_result_exam_student",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    exam_id: Mapped[int] = mapped_column(
        ForeignKey(
            "exams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
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

    marks_obtained: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
    )

    max_marks: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
    )

    grade: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

    result_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )