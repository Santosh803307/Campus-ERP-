from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import require_roles
from app.models.department import Department
from app.models.faculty import Faculty
from app.models.user import User
from app.schemas.faculty import (
    FacultyCreate,
    FacultyResponse,
    FacultyUpdate,
)


router = APIRouter(
    prefix="/api/faculty",
    tags=["Faculty"],
)


# =========================================================
# CREATE FACULTY
# =========================================================

@router.post(
    "/",
    response_model=FacultyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_faculty(
    data: FacultyCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # Check user
    user = db.get(User, data.user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # User must have faculty role
    if user.role.value != "faculty":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a faculty member",
        )

    # Check existing faculty profile
    existing_faculty = db.scalar(
        select(Faculty).where(
            Faculty.user_id == data.user_id
        )
    )

    if existing_faculty:
        raise HTTPException(
            status_code=400,
            detail="Faculty profile already exists for this user",
        )

    # Check department
    department = db.get(
        Department,
        data.department_id,
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    if not department.is_active:
        raise HTTPException(
            status_code=400,
            detail="Department is inactive",
        )

    # Check employee ID
    existing_employee = db.scalar(
        select(Faculty).where(
            Faculty.employee_id == data.employee_id
        )
    )

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Employee ID already exists",
        )

    faculty = Faculty(
        user_id=data.user_id,
        department_id=data.department_id,
        employee_id=data.employee_id,
        designation=data.designation,
        qualification=data.qualification,
        specialization=data.specialization,
        phone=data.phone,
        joining_date=data.joining_date,
    )

    db.add(faculty)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faculty could not be created because the data conflicts with an existing record",
     )

    db.refresh(faculty)

    return faculty  


# =========================================================
# LIST FACULTY
# =========================================================

@router.get(
    "/",
    response_model=list[FacultyResponse],
)
def get_faculty(
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    faculty = db.scalars(
        select(Faculty)
        .order_by(Faculty.id.desc())
    ).all()

    return faculty


# =========================================================
# GET SINGLE FACULTY
# =========================================================

@router.get(
    "/{faculty_id}",
    response_model=FacultyResponse,
)
def get_single_faculty(
    faculty_id: int,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    faculty = db.get(
        Faculty,
        faculty_id,
    )

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found",
        )

    return faculty


# =========================================================
# UPDATE FACULTY
# =========================================================

@router.patch(
    "/{faculty_id}",
    response_model=FacultyResponse,
)
def update_faculty(
    faculty_id: int,
    data: FacultyUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    faculty = db.get(
        Faculty,
        faculty_id,
    )

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # Department validation
    if "department_id" in update_data:
        department = db.get(
            Department,
            update_data["department_id"],
        )

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found",
            )

        if not department.is_active:
            raise HTTPException(
                status_code=400,
                detail="Department is inactive",
            )

    # Employee ID validation
    if "employee_id" in update_data:
        existing = db.scalar(
            select(Faculty).where(
                Faculty.employee_id
                == update_data["employee_id"],
                Faculty.id != faculty_id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Employee ID already exists",
            )

    for field, value in update_data.items():
        setattr(
            faculty,
            field,
            value,
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faculty could not be updated because the data conflicts with an existing record",
        )

    db.refresh(faculty)

    return faculty


# =========================================================
# DELETE FACULTY
# =========================================================

@router.delete(
    "/{faculty_id}",
)
def delete_faculty(
    faculty_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    faculty = db.get(
        Faculty,
        faculty_id,
    )

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found",
        )

    db.delete(faculty)

    try:
     db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faculty cannot be deleted because it is being used by other records",
        )

    return {
     "message": "Faculty deleted successfully"
    }