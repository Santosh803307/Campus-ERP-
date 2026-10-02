from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles

from app.models.department import Department
from app.models.fee_structure import FeeStructure
from app.models.student import Student
from app.models.student_fee import FeeStatus, StudentFee
from app.models.user import User

from app.schemas.fee import (
    FeeStructureCreate,
    FeeStructureResponse,
    FeeStructureUpdate,
    StudentFeeCreate,
    StudentFeeResponse,
)


router = APIRouter(
    prefix="/api/fees",
    tags=["Fees"],
)


# ============================================================
# 1. CREATE FEE STRUCTURE
# ============================================================

@router.post(
    "/structures",
    response_model=FeeStructureResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_fee_structure(
    data: FeeStructureCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    department = db.get(
        Department,
        data.department_id,
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    fee = FeeStructure(
        department_id=data.department_id,
        course=data.course,
        semester=data.semester,
        fee_type=data.fee_type,
        amount=data.amount,
        academic_year=data.academic_year,
    )

    db.add(fee)
    db.commit()
    db.refresh(fee)

    return fee


# ============================================================
# 2. GET ALL FEE STRUCTURES
# ============================================================

@router.get(
    "/structures",
    response_model=list[FeeStructureResponse],
)
def get_fee_structures(
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
    return db.scalars(
        select(FeeStructure)
        .order_by(
            FeeStructure.created_at.desc()
        )
    ).all()


# ============================================================
# 3. GET SINGLE FEE STRUCTURE
# ============================================================

@router.get(
    "/structures/{fee_id}",
    response_model=FeeStructureResponse,
)
def get_fee_structure(
    fee_id: int,
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
    fee = db.get(
        FeeStructure,
        fee_id,
    )

    if not fee:
        raise HTTPException(
            status_code=404,
            detail="Fee structure not found",
        )

    return fee


# ============================================================
# 4. UPDATE FEE STRUCTURE
# ============================================================

@router.patch(
    "/structures/{fee_id}",
    response_model=FeeStructureResponse,
)
def update_fee_structure(
    fee_id: int,
    data: FeeStructureUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    fee = db.get(
        FeeStructure,
        fee_id,
    )

    if not fee:
        raise HTTPException(
            status_code=404,
            detail="Fee structure not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            fee,
            field,
            value,
        )

    db.commit()
    db.refresh(fee)

    return fee


# ============================================================
# 5. ASSIGN FEE TO STUDENT
# ============================================================

@router.post(
    "/assign",
    response_model=StudentFeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_fee_to_student(
    data: StudentFeeCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # data.student_id is treated as USER ID
    # --------------------------------------------------------

    student_user = db.get(
        User,
        data.student_id,
    )

    if not student_user:
        raise HTTPException(
            status_code=404,
            detail="Student user not found",
        )

    if student_user.role.value != "student":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a student",
        )

    # --------------------------------------------------------
    # Find actual Student profile
    # --------------------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.user_id == student_user.id
        )
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Find Fee Structure
    # --------------------------------------------------------

    fee_structure = db.get(
        FeeStructure,
        data.fee_structure_id,
    )

    if not fee_structure:
        raise HTTPException(
            status_code=404,
            detail="Fee structure not found",
        )

    # --------------------------------------------------------
    # Create StudentFee using STUDENT ID
    # --------------------------------------------------------

    student_fee = StudentFee(
        student_id=student.id,
        fee_structure_id=data.fee_structure_id,
        amount=data.amount,
        paid_amount=0,
        due_date=data.due_date,
        status=FeeStatus.PENDING,
    )

    db.add(student_fee)
    db.commit()
    db.refresh(student_fee)

    return student_fee


# ============================================================
# 6. GET LOGGED-IN STUDENT FEES
# ============================================================

@router.get(
    "/my-fees",
    response_model=list[StudentFeeResponse],
)
def get_my_fees(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find Student profile using logged-in User ID
    # --------------------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Get fees using actual Student ID
    # --------------------------------------------------------

    fees = db.scalars(
        select(StudentFee)
        .where(
            StudentFee.student_id == student.id
        )
        .order_by(
            StudentFee.created_at.desc()
        )
    ).all()

    return list(fees)


# ============================================================
# 7. GET FEES OF SPECIFIC STUDENT
# ============================================================

@router.get(
    "/student/{student_id}",
    response_model=list[StudentFeeResponse],
)
def get_student_fees(
    student_id: int,
    current_user: User = Depends(
        require_roles(
            "admin",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # student_id from API is treated as USER ID
    # --------------------------------------------------------

    student_user = db.get(
        User,
        student_id,
    )

    if not student_user:
        raise HTTPException(
            status_code=404,
            detail="Student user not found",
        )

    # --------------------------------------------------------
    # Find actual Student profile
    # --------------------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.user_id == student_user.id
        )
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Get StudentFee records
    # --------------------------------------------------------

    fees = db.scalars(
        select(StudentFee)
        .where(
            StudentFee.student_id == student.id
        )
        .order_by(
            StudentFee.created_at.desc()
        )
    ).all()

    return list(fees)