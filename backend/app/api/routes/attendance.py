from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceListResponse,
    AttendanceResponse,
)


router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"],
)


# =========================================================
# STUDENT — MY ATTENDANCE
# =========================================================

@router.get(
    "/me",
    response_model=AttendanceListResponse,
)
def get_my_attendance(
    subject_code: str | None = Query(
        default=None,
        max_length=30,
    ),
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    query = select(Attendance).where(
        Attendance.student_id == student.id
    )

    if subject_code:
        query = query.where(
            Attendance.subject_code
            == subject_code.strip()
        )

    query = query.order_by(
        Attendance.date.desc(),
        Attendance.id.desc(),
    )

    attendance = db.scalars(query).all()

    return {
        "data": attendance,
        "total": len(attendance),
    }

# =========================================================
# STUDENT — ATTENDANCE SUMMARY
# =========================================================

@router.get(
    "/me/summary",
)
def get_my_attendance_summary(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    records = db.scalars(
        select(Attendance)
        .where(
            Attendance.student_id == student.id
        )
        .order_by(
            Attendance.subject.asc()
        )
    ).all()

    subjects = {}

    for record in records:
        code = record.subject_code

        if code not in subjects:
            subjects[code] = {
                "subject": record.subject,
                "subject_code": code,
                "present": 0,
                "absent": 0,
                "total": 0,
            }

        subjects[code]["total"] += 1

        if record.status.strip().lower() == "present":
            subjects[code]["present"] += 1
        elif record.status.strip().lower() == "absent":
            subjects[code]["absent"] += 1

    summary = []

    total_present = 0
    total_classes = 0

    for item in subjects.values():
        percentage = (
            (item["present"] / item["total"]) * 100
            if item["total"] > 0
            else 0
        )

        total_present += item["present"]
        total_classes += item["total"]

        summary.append({
            "subject": item["subject"],
            "subject_code": item["subject_code"],
            "present": item["present"],
            "absent": item["absent"],
            "total": item["total"],
            "percentage": round(
                percentage,
                2,
            ),
        })

    overall_percentage = (
        (total_present / total_classes) * 100
        if total_classes > 0
        else 0
    )

    return {
        "data": summary,
        "overall": {
            "present": total_present,
            "total": total_classes,
            "percentage": round(
                overall_percentage,
                2,
            ),
        },
    }
# =========================================================
# ADMIN / FACULTY / HOD — CREATE ATTENDANCE
# =========================================================

@router.post(
    "/",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_attendance(
    data: AttendanceCreate,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    student = db.get(
        Student,
        data.student_id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    attendance_status = data.status.strip().lower()

    if attendance_status not in {
        "present",
        "absent",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either present or absent",
        )

    existing = db.scalar(
        select(Attendance).where(
            Attendance.student_id
            == data.student_id,
            Attendance.subject_code
            == data.subject_code.strip(),
            Attendance.date
            == data.date,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already exists for this student, subject and date",
        )

    attendance = Attendance(
        student_id=data.student_id,
        subject=data.subject.strip(),
        subject_code=data.subject_code.strip(),
        date=data.date,
        status=attendance_status,
    )

    db.add(attendance)

    try:
        db.commit()
        db.refresh(attendance)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance record already exists",
        )

    return attendance

