from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles

from app.models.user import User, UserRole
from app.models.student import Student
from app.models.department import Department
from app.models.no_dues import NoDuesRequest, NoDuesStatus
from app.models.out_pass import OutPass, OutPassStatus
from app.models.payment import Payment


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


# ============================================================
# ADMIN - ERP ANALYTICS
# ============================================================

@router.get("/overview")
def get_analytics_overview(
    current_user: User = Depends(
        require_roles(UserRole.ADMIN.value)
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    active_users = db.scalar(
        select(func.count(User.id)).where(
            User.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # STUDENTS
    # --------------------------------------------------------

    total_students = db.scalar(
        select(func.count(Student.id))
    ) or 0

    # --------------------------------------------------------
    # FACULTY
    # --------------------------------------------------------

    total_faculty = db.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.FACULTY
        )
    ) or 0

    # --------------------------------------------------------
    # DEPARTMENTS
    # --------------------------------------------------------

    total_departments = db.scalar(
        select(func.count(Department.id))
    ) or 0

    # ========================================================
    # NO-DUES
    # ========================================================

    total_no_dues = db.scalar(
        select(func.count(NoDuesRequest.id))
    ) or 0

    pending_no_dues = db.scalar(
        select(func.count(NoDuesRequest.id)).where(
            NoDuesRequest.status.in_(
                [
                    NoDuesStatus.PENDING,
                    NoDuesStatus.IN_PROGRESS,
                ]
            )
        )
    ) or 0

    completed_no_dues = db.scalar(
        select(func.count(NoDuesRequest.id)).where(
            NoDuesRequest.status
            == NoDuesStatus.COMPLETED
        )
    ) or 0

    rejected_no_dues = db.scalar(
        select(func.count(NoDuesRequest.id)).where(
            NoDuesRequest.status
            == NoDuesStatus.REJECTED
        )
    ) or 0

    # ========================================================
    # OUT-PASS
    # ========================================================

    total_out_passes = db.scalar(
        select(func.count(OutPass.id))
    ) or 0

    pending_out_passes = db.scalar(
        select(func.count(OutPass.id)).where(
            OutPass.status
            == OutPassStatus.PENDING
        )
    ) or 0

    approved_out_passes = db.scalar(
        select(func.count(OutPass.id)).where(
            OutPass.status
            == OutPassStatus.APPROVED
        )
    ) or 0

    returned_out_passes = db.scalar(
        select(func.count(OutPass.id)).where(
            OutPass.status
            == OutPassStatus.RETURNED
        )
    ) or 0

    # ========================================================
    # PAYMENTS
    # ========================================================

    total_payments = db.scalar(
        select(func.count(Payment.id))
    ) or 0

    successful_payments = db.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == "SUCCESS"
        )
    ) or 0

    total_collected = db.scalar(
        select(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        ).where(
            Payment.status == "SUCCESS"
        )
    ) or 0

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "users": {
            "total": total_users,
            "active": active_users,
        },

        "students": {
            "total": total_students,
        },

        "faculty": {
            "total": total_faculty,
        },

        "departments": {
            "total": total_departments,
        },

        "no_dues": {
            "total": total_no_dues,
            "pending": pending_no_dues,
            "completed": completed_no_dues,
            "rejected": rejected_no_dues,
        },

        "out_pass": {
            "total": total_out_passes,
            "pending": pending_out_passes,
            "approved": approved_out_passes,
            "returned": returned_out_passes,
        },

        "payments": {
            "total_transactions": total_payments,
            "successful_transactions": successful_payments,
            "total_collected": float(total_collected),
        },
    }