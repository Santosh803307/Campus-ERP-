from datetime import date, time, datetime

from sqlalchemy import Date, DateTime, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    subject: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    subject_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    exam_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    exam_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    room: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    semester: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    course: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )