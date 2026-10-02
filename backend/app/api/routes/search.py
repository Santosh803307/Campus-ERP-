from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select, cast, String
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.department import Department
from app.models.fee_structure import FeeStructure
from app.models.no_dues import NoDuesRequest
from app.models.out_pass import OutPass
from app.models.payment import Payment
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.user import User


router = APIRouter(
    prefix="/api/search",
    tags=["Global Search"],
)


@router.get("/")
def global_search(
    q: str = Query(
        ...,
        min_length=2,
        max_length=100,
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    search = q.strip()

    if not search:
        return {
            "query": q,
            "count": 0,
            "results": [],
        }

    search_value = f"%{search}%"

    results = []

    # ==================================================
    # STUDENTS
    # ==================================================

    students = db.scalars(
        select(Student)
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
            or_(
                User.full_name.ilike(search_value),
                User.email.ilike(search_value),
                Student.enrollment_no.ilike(
                    search_value
                ),
                Student.course.ilike(search_value),
                Student.section.ilike(search_value),
            )
        )
        .order_by(Student.id.desc())
        .limit(10)
    ).all()

    for student in students:
        user = db.get(
            User,
            student.user_id,
        )

        results.append(
            {
                "type": "student",
                "id": student.id,
                "title": (
                    user.full_name
                    if user
                    else "Student"
                ),
                "subtitle": (
                    f"{student.enrollment_no} • "
                    f"{student.course} • "
                    f"Semester {student.semester}"
                ),
            }
        )

    # ==================================================
    # USERS
    # ==================================================

    users = db.scalars(
        select(User)
        .where(
            or_(
                User.full_name.ilike(
                    search_value
                ),
                User.email.ilike(
                    search_value
                ),
                cast(
                    User.role,
                    String,
                ).ilike(search_value),
            )
        )
        .order_by(User.id.desc())
        .limit(10)
    ).all()

    for user in users:
        results.append(
            {
                "type": "user",
                "id": user.id,
                "title": user.full_name,
                "subtitle": (
                    f"{user.email} • "
                    f"{user.role.value}"
                ),
            }
        )

    # ==================================================
    # FEE STRUCTURES
    # ==================================================

    fee_structures = db.scalars(
        select(FeeStructure)
        .join(
            Department,
            FeeStructure.department_id
            == Department.id,
        )
        .where(
            or_(
                FeeStructure.course.ilike(
                    search_value
                ),
                FeeStructure.fee_type.ilike(
                    search_value
                ),
                FeeStructure.academic_year.ilike(
                    search_value
                ),
                Department.name.ilike(
                    search_value
                ),
                Department.code.ilike(
                    search_value
                ),
            )
        )
        .order_by(
            FeeStructure.id.desc()
        )
        .limit(10)
    ).all()

    for fee in fee_structures:
        results.append(
            {
                "type": "fee_structure",
                "id": fee.id,
                "title": fee.fee_type,
                "subtitle": (
                    f"{fee.course} • "
                    f"Semester {fee.semester} • "
                    f"₹{fee.amount} • "
                    f"{fee.academic_year}"
                ),
            }
        )

    # ==================================================
    # STUDENT FEES
    # ==================================================

    student_fees = db.scalars(
        select(StudentFee)
        .join(
            Student,
            StudentFee.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
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
                cast(
                    StudentFee.status,
                    String,
                ).ilike(search_value),
            )
        )
        .order_by(
            StudentFee.id.desc()
        )
        .limit(10)
    ).all()

    for fee in student_fees:
        student = db.get(
            Student,
            fee.student_id,
        )

        user = (
            db.get(
                User,
                student.user_id,
            )
            if student
            else None
        )

        results.append(
            {
                "type": "student_fee",
                "id": fee.id,
                "title": (
                    user.full_name
                    if user
                    else "Student Fee"
                ),
                "subtitle": (
                    f"Amount ₹{fee.amount} • "
                    f"Paid ₹{fee.paid_amount} • "
                    f"{fee.status.value}"
                ),
            }
        )

    # ==================================================
    # PAYMENTS
    # ==================================================

    payments = db.scalars(
        select(Payment)
        .where(
            or_(
                Payment.razorpay_order_id.ilike(
                    search_value
                ),
                Payment.razorpay_payment_id.ilike(
                    search_value
                ),
                Payment.payment_method.ilike(
                    search_value
                ),
                cast(
                    Payment.status,
                    String,
                ).ilike(search_value),
            )
        )
        .order_by(Payment.id.desc())
        .limit(10)
    ).all()

    for payment in payments:
        results.append(
            {
                "type": "payment",
                "id": payment.id,
                "title": (
                    payment.razorpay_payment_id
                    or payment.razorpay_order_id
                ),
                "subtitle": (
                    f"₹{payment.amount} • "
                    f"{payment.status.value.upper()} • "
                    f"{payment.currency}"
                ),
            }
        )

    # ==================================================
    # NO DUES
    # ==================================================

    no_dues = db.scalars(
        select(NoDuesRequest)
        .join(
            Student,
            NoDuesRequest.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
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
                cast(
                    NoDuesRequest.status,
                    String,
                ).ilike(search_value),
            )
        )
        .order_by(
            NoDuesRequest.id.desc()
        )
        .limit(10)
    ).all()

    for request in no_dues:
        student = db.get(
            Student,
            request.student_id,
        )

        user = (
            db.get(
                User,
                student.user_id,
            )
            if student
            else None
        )

        results.append(
            {
                "type": "no_dues",
                "id": request.id,
                "title": (
                    user.full_name
                    if user
                    else "No-Dues Request"
                ),
                "subtitle": (
                    f"{student.enrollment_no if student else ''} • "
                    f"{request.status.value}"
                ),
            }
        )

    # ==================================================
    # OUT PASS
    # ==================================================

    out_passes = db.scalars(
        select(OutPass)
        .join(
            Student,
            OutPass.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
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
                OutPass.destination.ilike(
                    search_value
                ),
                OutPass.reason.ilike(
                    search_value
                ),
                OutPass.qr_token.ilike(
                    search_value
                ),
                cast(
                    OutPass.status,
                    String,
                ).ilike(search_value),
            )
        )
        .order_by(
            OutPass.id.desc()
        )
        .limit(10)
    ).all()

    for out_pass in out_passes:
        student = db.get(
            Student,
            out_pass.student_id,
        )

        user = (
            db.get(
                User,
                student.user_id,
            )
            if student
            else None
        )

        results.append(
            {
                "type": "out_pass",
                "id": out_pass.id,
                "title": (
                    user.full_name
                    if user
                    else "Out Pass"
                ),
                "subtitle": (
                    f"{student.enrollment_no if student else ''} • "
                    f"{out_pass.destination} • "
                    f"{out_pass.status.value}"
                ),
            }
        )

    return {
        "query": search,
        "count": len(results),
        "results": results,
    }