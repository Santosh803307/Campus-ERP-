from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_roles,
    hash_password,
)
from app.models.department import Department
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.student import (
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)


router = APIRouter(
    prefix="/api/students",
    tags=["Students"],
)

class StudentDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    department_id: int
    enrollment_no: str
    phone: str | None
    course: str
    semester: int
    section: str | None
    admission_year: int
    is_active: bool
    created_at: object

    full_name: str
    email: str

    department_name: str
    department_code: str

# =========================================================
# CREATE STUDENT PROFILE
# =========================================================

@router.post(
    "/",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    data: StudentCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------
    # 1. Check department
    # --------------------------------------------------
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

    # --------------------------------------------------
    # 2. Check email
    # --------------------------------------------------
    normalized_email = data.email.strip().lower()

    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email)
            == normalized_email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # --------------------------------------------------
    # 3. Check enrollment number
    # --------------------------------------------------
    existing_enrollment = db.scalar(
        select(Student).where(
            Student.enrollment_no
            == data.enrollment_no.strip()
        )
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Enrollment number already exists",
        )

    # --------------------------------------------------
    # 4. Create User account
    # --------------------------------------------------
    user = User(
        full_name=data.full_name.strip(),
        email=normalized_email,
        hashed_password=hash_password(
            data.password
        ),
        role=UserRole.STUDENT,
        is_active=True,
    )

    db.add(user)

    try:
        # Flush generates user.id without committing.
        db.flush()

        # --------------------------------------------------
        # 5. Create Student profile
        # --------------------------------------------------
        student = Student(
            user_id=user.id,
            department_id=data.department_id,
            enrollment_no=data.enrollment_no.strip(),
            phone=(
                data.phone.strip()
                if data.phone
                else None
            ),
            course=data.course.strip(),
            semester=data.semester,
            section=(
                data.section.strip()
                if data.section
                else None
            ),
            admission_year=data.admission_year,
        )

        db.add(student)

        # --------------------------------------------------
        # 6. Commit User + Student together
        # --------------------------------------------------
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Student could not be created "
                "because the data conflicts "
                "with an existing record"
            ),
        )

    except Exception:
        db.rollback()
        raise

    db.refresh(student)

    return student
# =========================================================
# LIST / SEARCH / FILTER STUDENTS
# =========================================================

@router.get(
    "/",
    response_model=StudentListResponse,
)
def get_students(
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    department_id: int | None = Query(
        default=None,
        ge=1,
    ),
    semester: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    section: str | None = Query(
        default=None,
        max_length=20,
    ),
    is_active: bool | None = Query(
        default=None,
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
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
    query = (
        select(Student)
        .join(
            User,
            Student.user_id == User.id,
        )
    )

    # Search
    if search:
        search_value = (
            f"%{search.strip()}%"
        )

        query = query.where(
            Student.enrollment_no.ilike(
                search_value
            )
            | Student.course.ilike(
                search_value
            )
            | Student.section.ilike(
                search_value
            )
            | User.full_name.ilike(
                search_value
            )
            | User.email.ilike(
                search_value
            )
        )

    # Department filter
    if department_id is not None:
        query = query.where(
            Student.department_id
            == department_id
        )

    # Semester filter
    if semester is not None:
        query = query.where(
            Student.semester == semester
        )

    # Section filter
    if section:
        query = query.where(
            Student.section.ilike(
                section.strip()
            )
        )

    # Active / inactive filter
    if is_active is not None:
        query = query.where(
            Student.is_active == is_active
        )

    # Total count
    count_query = select(
        func.count()
    ).select_from(
        query.order_by(None).subquery()
    )

    total = db.scalar(
        count_query
    ) or 0

    # Pagination
    offset = (page - 1) * limit

    query = (
        query
        .order_by(Student.id.desc())
        .offset(offset)
        .limit(limit)
    )

    students = db.scalars(
        query
    ).all()

    # -----------------------------------------------------
    # Total pages
    # -----------------------------------------------------

    pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return {
        "data": students,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
        },
    }
# =========================================================
# MY STUDENT PROFILE
# =========================================================

@router.get(
    "/me",
    response_model=StudentDetailResponse,
)
def get_my_student_profile(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(
            Student,
            User,
            Department,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .join(
            Department,
            Student.department_id == Department.id,
        )
        .where(
            Student.user_id == current_user.id
        )
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    student, user, department = result

    return {
        "id": student.id,
        "user_id": student.user_id,
        "department_id": student.department_id,
        "enrollment_no": student.enrollment_no,
        "phone": student.phone,
        "course": student.course,
        "semester": student.semester,
        "section": student.section,
        "admission_year": student.admission_year,
        "is_active": student.is_active,
        "created_at": student.created_at,

        "full_name": user.full_name,
        "email": user.email,

        "department_name": department.name,
        "department_code": department.code,
    }

# =========================================================
# SEARCH STUDENTS FOR ADMIN / RESULT MANAGEMENT
# =========================================================

class StudentSearchResponse(BaseModel):
    id: int
    enrollment_no: str
    full_name: str
    email: str
    course: str
    semester: int
    section: str | None
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )


@router.get(
    "/search",
    response_model=list[StudentSearchResponse],
)
def search_students(
    search: str = Query(
        default="",
        max_length=100,
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
    search_text = search.strip()

    if not search_text:
        return []

    search_value = f"%{search_text}%"

    results = db.execute(
        select(
            Student,
            User,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
            Student.is_active.is_(True),
            (
                User.full_name.ilike(
                    search_value
                )
                | User.email.ilike(
                    search_value
                )
                | Student.enrollment_no.ilike(
                    search_value
                )
                | Student.course.ilike(
                    search_value
                )
            ),
        )
        .order_by(
            User.full_name.asc()
        )
        .limit(20)
    ).all()

    return [
        {
            "id": student.id,
            "enrollment_no": student.enrollment_no,
            "full_name": user.full_name,
            "email": user.email,
            "course": student.course,
            "semester": student.semester,
            "section": student.section,
            "is_active": student.is_active,
        }
        for student, user in results
    ]

# =========================================================
# GET SINGLE STUDENT
# =========================================================

@router.get(
    "/{student_id}",
    response_model=StudentDetailResponse,
)
def get_student(
    student_id: int,
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(
            Student,
            User,
            Department,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .join(
            Department,
            Student.department_id == Department.id,
        )
        .where(
            Student.id == student_id
        )
    ).first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    student, user, department = result

    return {
        "id": student.id,
        "user_id": student.user_id,
        "department_id": student.department_id,
        "enrollment_no": student.enrollment_no,
        "phone": student.phone,
        "course": student.course,
        "semester": student.semester,
        "section": student.section,
        "admission_year": student.admission_year,
        "is_active": student.is_active,
        "created_at": student.created_at,

        "full_name": user.full_name,
        "email": user.email,

        "department_name": department.name,
        "department_code": department.code,
    }


# =========================================================
# UPDATE STUDENT
# =========================================================

@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
)
def update_student(
    student_id: int,
    data: StudentUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    student = db.get(
        Student,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
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

    # Enrollment validation
    if "enrollment_no" in update_data:
        existing = db.scalar(
            select(Student).where(
                Student.enrollment_no
                == update_data["enrollment_no"],
                Student.id != student_id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Enrollment number already exists",
            )

    for field, value in update_data.items():
        setattr(
            student,
            field,
            value,
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student could not be updated because the data conflicts with an existing record",
        )

    db.refresh(student)

    return student


# =========================================================
# DELETE STUDENT PROFILE
# =========================================================

@router.delete(
    "/{student_id}",
)
def delete_student(
    student_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    student = db.get(
        Student,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    db.delete(student)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student cannot be deleted because it is being used by other records",
        )
    
    return {
        "message": "Student deleted successfully"
    }