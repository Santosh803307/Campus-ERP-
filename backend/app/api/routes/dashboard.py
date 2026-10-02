from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.student import Student
from app.models.user import User
from app.schemas.dashboard import (
    AdminDashboardResponse,
    FacultyDashboardResponse,
    StudentDashboardResponse,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)

@router.get(
    "/student",
    response_model=StudentDashboardResponse,
)
def student_dashboard(
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

    return {
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,

        "enrollment_no": (
            student.enrollment_no
            if student else None
        ),

        "department": (
            student.department
            if student else None
        ),

        "course": (
            student.course
            if student else None
        ),

        "semester": (
            student.semester
            if student else None
        ),

        "pending_fees": 0,
        "no_dues_status": "not_started",
        "hostel_status": "not_applicable",
    }

@router.get(
    "/faculty",
    response_model=FacultyDashboardResponse,
)
def faculty_dashboard(
    current_user: User = Depends(
        require_roles("faculty", "hod")
    ),
    db: Session = Depends(get_db),
):

    total_students = db.scalar(
        select(func.count())
        .select_from(Student)
    ) or 0

    return {
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,

        "total_students": total_students,
        "pending_tasks": 0,
    }

@router.get(
    "/admin",
    response_model=AdminDashboardResponse,
)
def admin_dashboard(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    total_users = db.scalar(
        select(func.count())
        .select_from(User)
    ) or 0

    total_students = db.scalar(
        select(func.count())
        .select_from(Student)
    ) or 0

    total_faculty = db.scalar(
        select(func.count())
        .select_from(User)
        .where(
            User.role == "faculty"
        )
    ) or 0

    return {
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,

        "total_users": total_users,
        "total_students": total_students,
        "total_faculty": total_faculty,
        "pending_requests": 0,
    }