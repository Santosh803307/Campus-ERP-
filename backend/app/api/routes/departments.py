from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.department import Department
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)


router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"],
)

@router.post(
    "/",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    existing_name = db.scalar(
        select(Department).where(
            Department.name == data.name
        )
    )

    if existing_name:
        raise HTTPException(
            status_code=400,
            detail="Department name already exists",
        )

    existing_code = db.scalar(
        select(Department).where(
            Department.code == data.code.upper()
        )
    )

    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Department code already exists",
        )

    department = Department(
        name=data.name,
        code=data.code.upper(),
        description=data.description,
    )

    db.add(department)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department code or name already exists",
        )

    db.refresh(department)

    return department

@router.get("/")
def get_departments(
    search: str | None = Query(
        default=None,
        max_length=100,
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
            "student",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    query = select(Department)

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.where(
            or_(
                Department.name.ilike(search_value),
                Department.code.ilike(search_value),
                Department.description.ilike(search_value),
            )
        )

    # -----------------------------------------------------
    # STATUS FILTER
    # -----------------------------------------------------

    if is_active is not None:
        query = query.where(
            Department.is_active == is_active
        )

    # -----------------------------------------------------
    # TOTAL COUNT
    # -----------------------------------------------------

    count_query = select(
        func.count()
    ).select_from(
        query.order_by(None).subquery()
    )

    total = db.scalar(count_query) or 0

    # -----------------------------------------------------
    # PAGINATION
    # -----------------------------------------------------

    offset = (page - 1) * limit

    departments = db.scalars(
        query
        .order_by(Department.name)
        .offset(offset)
        .limit(limit)
    ).all()

    pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return {
        "data": departments,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
        },
    }
@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department(
    department_id: int,
    current_user: User = Depends(
        require_roles(
            "admin",
            "student",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    department = db.get(
        Department,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    return department

@router.patch(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    department = db.get(
        Department,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        existing = db.scalar(
            select(Department).where(
                Department.name == update_data["name"],
                Department.id != department_id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Department name already exists",
            )

    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()

        existing = db.scalar(
            select(Department).where(
                Department.code == update_data["code"],
                Department.id != department_id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Department code already exists",
            )

    for field, value in update_data.items():
        setattr(department, field, value)

    try:
        db.commit()
    except IntegrityError:
       db.rollback()
       raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department code or name already exists",
        )

    db.refresh(department)

    return department

@router.delete(
    "/{department_id}",
)
def delete_department(
    department_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    department = db.get(
        Department,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    db.delete(department)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Department cannot be deleted because "
                "it is being used by other records"
            ),
        )
    
    return {
        "message": "Department deleted successfully"
    }