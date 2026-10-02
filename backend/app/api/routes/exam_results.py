from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.exam import Exam
from app.models.exam_result import ExamResult
from app.models.student import Student
from app.models.user import User
from app.schemas.exam_result import (
    ExamResultCreate,
    ExamResultListResponse,
    ExamResultResponse,
    ExamResultUpdate,
    StudentExamResultListResponse,
)


router = APIRouter(
    prefix="/api/exam-results",
    tags=["Exam Results"],
)


# =========================================================
# GRADE CALCULATION
# =========================================================

def calculate_grade(
    percentage: Decimal,
) -> str:

    if percentage >= Decimal("90"):
        return "A+"

    elif percentage >= Decimal("80"):
        return "A"

    elif percentage >= Decimal("70"):
        return "B+"

    elif percentage >= Decimal("60"):
        return "B"

    elif percentage >= Decimal("50"):
        return "C"

    elif percentage >= Decimal("40"):
        return "D"

    return "F"


# =========================================================
# RESULT STATUS
# =========================================================

def calculate_result_status(
    percentage: Decimal,
) -> str:

    if percentage >= Decimal("40"):
        return "PASS"

    return "FAIL"


# =========================================================
# STUDENT — MY RESULTS
# =========================================================

@router.get(
    "/me",
    response_model=StudentExamResultListResponse,
)
def get_my_results(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND STUDENT PROFILE
    # -----------------------------------------------------

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
    # JOIN RESULTS WITH EXAMS
    # -----------------------------------------------------

    query = (
        select(
            ExamResult,
            Exam,
        )
        .join(
            Exam,
            Exam.id == ExamResult.exam_id,
        )
        .where(
            ExamResult.student_id == student.id
        )
        .order_by(
            Exam.exam_date.desc(),
            Exam.start_time.desc(),
            ExamResult.id.desc(),
        )
    )

    rows = db.execute(query).all()

    data = []

    for result, exam in rows:

        data.append(
            {
                "id": result.id,
                "exam_id": result.exam_id,
                "student_id": result.student_id,

                "subject": exam.subject,
                "subject_code": exam.subject_code,
                "exam_type": exam.exam_type,
                "exam_date": exam.exam_date,

                "start_time": exam.start_time.strftime(
                    "%H:%M:%S"
                ),

                "end_time": exam.end_time.strftime(
                    "%H:%M:%S"
                ),

                "room": exam.room,

                "marks_obtained": result.marks_obtained,
                "max_marks": result.max_marks,

                "grade": result.grade,
                "result_status": result.result_status,

                "remarks": result.remarks,

                "created_at": result.created_at,
                "updated_at": result.updated_at,
            }
        )

    return {
        "data": data,
        "total": len(data),
    }


# =========================================================
# RESULT OVERVIEW
#
# ADMIN / FACULTY / HOD
#
# IMPORTANT:
# This route must come BEFORE:
# /{result_id}
# =========================================================

@router.get(
    "/overview",
)
def get_result_overview(
    exam_id: int | None = None,
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
    # BASE QUERY
    # -----------------------------------------------------

    query = select(ExamResult)

    # -----------------------------------------------------
    # OPTIONAL EXAM FILTER
    # -----------------------------------------------------

    if exam_id is not None:
        query = query.where(
            ExamResult.exam_id == exam_id
        )

    results = db.scalars(query).all()

    # -----------------------------------------------------
    # TOTAL
    # -----------------------------------------------------

    total_results = len(results)

    # -----------------------------------------------------
    # PASSED
    # -----------------------------------------------------

    passed = sum(
        1
        for result in results
        if result.result_status.upper()
        == "PASS"
    )

    # -----------------------------------------------------
    # FAILED
    # -----------------------------------------------------

    failed = sum(
        1
        for result in results
        if result.result_status.upper()
        == "FAIL"
    )

    # -----------------------------------------------------
    # PASS PERCENTAGE
    # -----------------------------------------------------

    pass_percentage = (
        round(
            (passed / total_results) * 100,
            2,
        )
        if total_results
        else 0
    )

    return {
        "total_results": total_results,
        "passed": passed,
        "failed": failed,
        "pass_percentage": pass_percentage,
    }


# =========================================================
# GET ALL RESULTS
#
# ADMIN / FACULTY / HOD
#
# Features:
# - Student search
# - Student ID filter
# - Exam filter
# - Grade filter
# - PASS/FAIL filter
# =========================================================

@router.get(
    "/",
    response_model=ExamResultListResponse,
)
def get_results(
    search: str | None = None,
    exam_id: int | None = None,
    student_id: int | None = None,
    grade: str | None = None,
    result_status: str | None = None,
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
    # JOIN:
    #
    # ExamResult
    #      ↓
    # Student
    #      ↓
    # User
    #
    # This allows searching student name/email/enrollment.
    # -----------------------------------------------------

    query = (
        select(ExamResult)
        .join(
            Student,
            Student.id == ExamResult.student_id,
        )
        .join(
            User,
            User.id == Student.user_id,
        )
    )

    # -----------------------------------------------------
    # STUDENT ID FILTER
    # -----------------------------------------------------

    if student_id is not None:
        query = query.where(
            ExamResult.student_id == student_id
        )

    # -----------------------------------------------------
    # EXAM FILTER
    # -----------------------------------------------------

    if exam_id is not None:
        query = query.where(
            ExamResult.exam_id == exam_id
        )

    # -----------------------------------------------------
    # GRADE FILTER
    # -----------------------------------------------------

    if grade:
        query = query.where(
            ExamResult.grade.ilike(
                grade.strip()
            )
        )

    # -----------------------------------------------------
    # RESULT STATUS FILTER
    #
    # PASS / FAIL
    # -----------------------------------------------------

    if result_status:
        query = query.where(
            ExamResult.result_status.ilike(
                result_status.strip()
            )
        )

    # -----------------------------------------------------
    # SEARCH
    #
    # Search by:
    # - Student name
    # - Student email
    # - Enrollment number
    # -----------------------------------------------------

    if search:
        search_value = (
            f"%{search.strip()}%"
        )

        query = query.where(
            or_(
                User.full_name.ilike(
                    search_value
                ),

                User.email.ilike(
                    search_value
                ),

                Student.enrollment_no.ilike(
                    search_value
                ),
            )
        )

    # -----------------------------------------------------
    # ORDER
    # -----------------------------------------------------

    query = query.order_by(
        ExamResult.id.desc()
    )

    results = db.scalars(query).all()

    return {
        "data": results,
        "total": len(results),
    }


# =========================================================
# CREATE RESULT
#
# ADMIN / FACULTY / HOD
# =========================================================

@router.post(
    "/",
    response_model=ExamResultResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_result(
    data: ExamResultCreate,
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
    # CHECK EXAM
    # -----------------------------------------------------

    exam = db.get(
        Exam,
        data.exam_id,
    )

    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found",
        )

    # -----------------------------------------------------
    # CHECK STUDENT
    # -----------------------------------------------------

    student = db.get(
        Student,
        data.student_id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # -----------------------------------------------------
    # VALIDATE SEMESTER
    # -----------------------------------------------------

    if student.semester != exam.semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Student semester does not match "
                "the examination semester"
            ),
        )

    # -----------------------------------------------------
    # VALIDATE COURSE
    # -----------------------------------------------------

    if (
        student.course.strip().lower()
        != exam.course.strip().lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Student course does not match "
                "the examination course"
            ),
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE RESULT
    # -----------------------------------------------------

    existing_result = db.scalar(
        select(ExamResult).where(
            ExamResult.exam_id == data.exam_id,
            ExamResult.student_id == data.student_id,
        )
    )

    if existing_result:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Result already exists for "
                "this student and exam"
            ),
        )

    # -----------------------------------------------------
    # VALIDATE MARKS
    # -----------------------------------------------------

    if data.max_marks <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Maximum marks must be "
                "greater than zero"
            ),
        )

    if data.marks_obtained < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Marks obtained cannot "
                "be negative"
            ),
        )

    if data.marks_obtained > data.max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Marks obtained cannot exceed "
                "maximum marks"
            ),
        )

    # -----------------------------------------------------
    # CALCULATE PERCENTAGE
    # -----------------------------------------------------

    percentage = (
        data.marks_obtained
        / data.max_marks
    ) * Decimal("100")

    # -----------------------------------------------------
    # CALCULATE GRADE
    # -----------------------------------------------------

    grade = calculate_grade(
        percentage
    )

    # -----------------------------------------------------
    # CALCULATE PASS / FAIL
    # -----------------------------------------------------

    result_status = calculate_result_status(
        percentage
    )

    # -----------------------------------------------------
    # CREATE RESULT
    # -----------------------------------------------------

    result = ExamResult(
        exam_id=data.exam_id,
        student_id=data.student_id,
        marks_obtained=data.marks_obtained,
        max_marks=data.max_marks,
        grade=grade,
        result_status=result_status,
        remarks=(
            data.remarks.strip()
            if data.remarks
            else None
        ),
    )

    db.add(result)

    try:
        db.commit()
        db.refresh(result)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Result could not be created",
        )

    return result


# =========================================================
# UPDATE RESULT
#
# ADMIN / FACULTY / HOD
# =========================================================

@router.patch(
    "/{result_id}",
    response_model=ExamResultResponse,
)
def update_result(
    result_id: int,
    data: ExamResultUpdate,
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
    # FIND RESULT
    # -----------------------------------------------------

    result = db.get(
        ExamResult,
        result_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found",
        )

    # -----------------------------------------------------
    # GET PROVIDED FIELDS ONLY
    # -----------------------------------------------------

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # CURRENT / NEW MARKS
    # -----------------------------------------------------

    marks_obtained = update_data.get(
        "marks_obtained",
        result.marks_obtained,
    )

    max_marks = update_data.get(
        "max_marks",
        result.max_marks,
    )

    # -----------------------------------------------------
    # VALIDATE MAX MARKS
    # -----------------------------------------------------

    if max_marks <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Maximum marks must be "
                "greater than zero"
            ),
        )

    # -----------------------------------------------------
    # VALIDATE MARKS
    # -----------------------------------------------------

    if marks_obtained < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Marks obtained cannot "
                "be negative"
            ),
        )

    if marks_obtained > max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Marks obtained cannot exceed "
                "maximum marks"
            ),
        )

    # -----------------------------------------------------
    # RECALCULATE PERCENTAGE
    # -----------------------------------------------------

    percentage = (
        marks_obtained
        / max_marks
    ) * Decimal("100")

    # -----------------------------------------------------
    # RECALCULATE GRADE
    # -----------------------------------------------------

    result.grade = calculate_grade(
        percentage
    )

    # -----------------------------------------------------
    # RECALCULATE RESULT STATUS
    # -----------------------------------------------------

    result.result_status = calculate_result_status(
        percentage
    )

    # -----------------------------------------------------
    # UPDATE FIELDS
    # -----------------------------------------------------

    for field, value in update_data.items():

        if isinstance(value, str):
            value = value.strip()

        setattr(
            result,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(result)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Result could not be updated",
        )

    return result


# =========================================================
# DELETE RESULT
#
# ADMIN ONLY
# =========================================================

@router.delete(
    "/{result_id}",
)
def delete_result(
    result_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND RESULT
    # -----------------------------------------------------

    result = db.get(
        ExamResult,
        result_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found",
        )

    # -----------------------------------------------------
    # DELETE
    # -----------------------------------------------------

    db.delete(result)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Result could not be deleted",
        )

    return {
        "message": "Result deleted successfully"
    }