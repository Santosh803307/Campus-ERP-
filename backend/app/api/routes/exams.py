from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.exam import Exam
from app.models.user import User
from app.schemas.exam import (
    ExamCreate,
    ExamListResponse,
    ExamResponse,
    ExamUpdate,
)


router = APIRouter(
    prefix="/api/exams",
    tags=["Examinations"],
)


# =========================================================
# GET ALL EXAMS
# ADMIN / FACULTY / HOD
#
# Features:
# - Search by subject
# - Search by subject code
# - Search by room
# - Semester filter
# - Course filter
# - Exam type filter
# - Timetable ordering
# =========================================================

@router.get(
    "/",
    response_model=ExamListResponse,
)
def get_exams(
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    semester: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    course: str | None = Query(
        default=None,
        max_length=100,
    ),
    exam_type: str | None = Query(
        default=None,
        max_length=30,
    ),
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    query = select(Exam)

    # -----------------------------------------------------
    # SEARCH
    # Subject / Subject Code / Room
    # -----------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.where(
            Exam.subject.ilike(search_value)
            | Exam.subject_code.ilike(search_value)
            | Exam.room.ilike(search_value)
        )

    # -----------------------------------------------------
    # SEMESTER FILTER
    # -----------------------------------------------------

    if semester is not None:
        query = query.where(
            Exam.semester == semester
        )

    # -----------------------------------------------------
    # COURSE FILTER
    # -----------------------------------------------------

    if course:
        query = query.where(
            Exam.course.ilike(
                f"%{course.strip()}%"
            )
        )

    # -----------------------------------------------------
    # EXAM TYPE FILTER
    # -----------------------------------------------------

    if exam_type:
        query = query.where(
            Exam.exam_type.ilike(
                f"%{exam_type.strip()}%"
            )
        )

    # -----------------------------------------------------
    # TIMETABLE ORDER
    #
    # First:
    #   Exam Date
    #
    # Then:
    #   Start Time
    # -----------------------------------------------------

    query = query.order_by(
        Exam.exam_date.asc(),
        Exam.start_time.asc(),
    )

    exams = db.scalars(query).all()

    return {
        "data": exams,
        "total": len(exams),
    }


# =========================================================
# STUDENT — MY EXAMINATION SCHEDULE
# =========================================================

@router.get(
    "/me",
    response_model=ExamListResponse,
)
def get_my_exams(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    from app.models.student import Student

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

    # -----------------------------------------------------
    # NORMALIZE COURSE NAMES
    #
    # Examples:
    # B-Tech CSE
    # B.Tech CSE
    # B Tech CSE
    # BTech CSE
    #
    # All can match.
    # -----------------------------------------------------

    normalized_exam_course = func.lower(
        func.replace(
            func.replace(
                func.replace(
                    Exam.course,
                    "-",
                    "",
                ),
                ".",
                "",
            ),
            " ",
            "",
        )
    )

    normalized_student_course = func.lower(
        func.replace(
            func.replace(
                func.replace(
                    student.course,
                    "-",
                    "",
                ),
                ".",
                "",
            ),
            " ",
            "",
        )
    )

    # -----------------------------------------------------
    # GET EXAMS FOR STUDENT
    # -----------------------------------------------------

    query = (
        select(Exam)
        .where(
            Exam.semester == student.semester,
            normalized_exam_course
            == normalized_student_course,
        )
        .order_by(
            Exam.exam_date.asc(),
            Exam.start_time.asc(),
        )
    )

    exams = db.scalars(query).all()

    return {
        "data": exams,
        "total": len(exams),
    }


# =========================================================
# CREATE EXAM
# ADMIN / FACULTY / HOD
# =========================================================

@router.post(
    "/",
    response_model=ExamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exam(
    data: ExamCreate,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # VALIDATE EXAM TIME
    # -----------------------------------------------------

    if data.end_time <= data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    # -----------------------------------------------------
    # CREATE EXAM
    # -----------------------------------------------------

    exam = Exam(
        subject=data.subject.strip(),
        subject_code=data.subject_code.strip(),
        exam_type=data.exam_type.strip(),
        exam_date=data.exam_date,
        start_time=data.start_time,
        end_time=data.end_time,
        room=data.room.strip(),
        semester=data.semester,
        course=data.course.strip(),
    )

    db.add(exam)

    try:
        db.commit()
        db.refresh(exam)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Exam could not be created",
        )

    return exam


# =========================================================
# UPDATE EXAM
# ADMIN / FACULTY / HOD
# =========================================================

@router.patch(
    "/{exam_id}",
    response_model=ExamResponse,
)
def update_exam(
    exam_id: int,
    data: ExamUpdate,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND EXAM
    # -----------------------------------------------------

    exam = db.get(
        Exam,
        exam_id,
    )

    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found",
        )

    # -----------------------------------------------------
    # GET ONLY PROVIDED FIELDS
    # -----------------------------------------------------

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # VALIDATE NEW TIME
    # -----------------------------------------------------

    new_start_time = update_data.get(
        "start_time",
        exam.start_time,
    )

    new_end_time = update_data.get(
        "end_time",
        exam.end_time,
    )

    if new_end_time <= new_start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )

    # -----------------------------------------------------
    # UPDATE FIELDS
    # -----------------------------------------------------

    for field, value in update_data.items():

        if isinstance(value, str):
            value = value.strip()

        setattr(
            exam,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(exam)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Exam could not be updated",
        )

    return exam


# =========================================================
# DELETE EXAM
# ADMIN ONLY
# =========================================================

@router.delete(
    "/{exam_id}",
)
def delete_exam(
    exam_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND EXAM
    # -----------------------------------------------------

    exam = db.get(
        Exam,
        exam_id,
    )

    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found",
        )

    # -----------------------------------------------------
    # DELETE EXAM
    #
    # exam_results.exam_id has ON DELETE CASCADE
    # so related results will also be deleted.
    # -----------------------------------------------------

    db.delete(exam)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Exam cannot be deleted",
        )

    return {
        "message": "Exam deleted successfully"
    }