from datetime import datetime
import hashlib
import hmac

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Query,
    status
)
from fastapi.responses import StreamingResponse

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_roles

from app.services.notification_service import (
    create_notification,
    queue_notification_email,
)

from app.models.payment import (
    Payment,
    PaymentStatus,
)

from app.models.notification import NotificationType

from app.models.student_fee import (
    FeeStatus,
    StudentFee,
)

from app.models.student import Student
from app.models.user import User

from app.schemas.payment import (
    CreatePaymentOrderResponse,
    PaymentResponse,
    VerifyPaymentRequest,
)

from app.services.payment_service import (
    get_razorpay_client,
)

from app.services.receipt_service import (
    generate_receipt_pdf,
)
from app.services.audit_service import create_audit_log

router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


# ============================================================
# 1. CREATE RAZORPAY ORDER
# ============================================================

@router.post(
    "/create-order",
    response_model=CreatePaymentOrderResponse,
)
def create_payment_order(
    student_fee_id: int,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find logged-in student's Student profile
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
    # Find StudentFee
    # --------------------------------------------------------

    student_fee = db.get(
        StudentFee,
        student_fee_id,
    )

    if student_fee is None:
        raise HTTPException(
            status_code=404,
            detail="Student fee not found",
        )

    # --------------------------------------------------------
    # Student can pay only their own fee
    # --------------------------------------------------------

    if student_fee.student_id != student.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot pay this fee",
        )

    # --------------------------------------------------------
    # Already fully paid
    # --------------------------------------------------------

    if student_fee.status == FeeStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Fee is already paid",
        )

    # --------------------------------------------------------
    # Calculate remaining amount
    # --------------------------------------------------------

    remaining_amount = (
        student_fee.amount
        - student_fee.paid_amount
    )

    if remaining_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="No pending amount",
        )

    # --------------------------------------------------------
    # Razorpay uses paise
    # --------------------------------------------------------

    amount_paise = int(
        remaining_amount * 100
    )

    # --------------------------------------------------------
    # Razorpay client
    # --------------------------------------------------------

    client = get_razorpay_client()

    try:
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": (
                    f"fee_{student_fee.id}_"
                    f"{int(datetime.utcnow().timestamp())}"
                ),
            }
        )

    except Exception as exc:
        print(
            "========== RAZORPAY ORDER ERROR =========="
        )
        print(type(exc).__name__)
        print(str(exc))
        print(
            "=========================================="
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create Razorpay order: "
                f"{str(exc)}"
            ),
        )

    # --------------------------------------------------------
    # Save payment
    # --------------------------------------------------------

    payment = Payment(
        student_fee_id=student_fee.id,
        razorpay_order_id=order["id"],
        amount=remaining_amount,
        currency="INR",
        status=PaymentStatus.CREATED,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "payment_id": payment.id,
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
    }


# ============================================================
# 2. VERIFY RAZORPAY PAYMENT
# ============================================================

@router.post(
    "/verify",
    response_model=PaymentResponse,
)
def verify_payment(
    data: VerifyPaymentRequest,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find payment
    # --------------------------------------------------------

    payment = db.get(
        Payment,
        data.payment_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    # --------------------------------------------------------
    # Find StudentFee
    # --------------------------------------------------------

    student_fee = db.get(
        StudentFee,
        payment.student_fee_id,
    )

    if student_fee is None:
        raise HTTPException(
            status_code=404,
            detail="Student fee not found",
        )

    # --------------------------------------------------------
    # Find logged-in Student profile
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
    # Make sure payment belongs to logged-in student
    # --------------------------------------------------------

    if student_fee.student_id != student.id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized payment",
        )

    # --------------------------------------------------------
    # Prevent duplicate verification
    # --------------------------------------------------------

    if payment.status == PaymentStatus.SUCCESS:
        return payment

    # --------------------------------------------------------
    # Verify Razorpay order ID
    # --------------------------------------------------------

    if (
        payment.razorpay_order_id
        != data.razorpay_order_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Order ID mismatch",
        )

    # --------------------------------------------------------
    # Verify Razorpay payment signature
    # --------------------------------------------------------

    client = get_razorpay_client()

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id":
                    data.razorpay_order_id,

                "razorpay_payment_id":
                    data.razorpay_payment_id,

                "razorpay_signature":
                    data.razorpay_signature,
            }
        )

    except Exception:
        payment.status = PaymentStatus.FAILED

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature",
        )

    # --------------------------------------------------------
    # Save Razorpay payment information
    # --------------------------------------------------------

    payment.razorpay_payment_id = (
        data.razorpay_payment_id
    )

    payment.razorpay_signature = (
        data.razorpay_signature
    )

    payment.status = PaymentStatus.SUCCESS
    payment.paid_at = datetime.utcnow()

    # --------------------------------------------------------
    # Update paid amount
    # --------------------------------------------------------

    student_fee.paid_amount = (
        student_fee.paid_amount
        + payment.amount
    )

    # --------------------------------------------------------
    # Update fee status
    # --------------------------------------------------------

    if (
        student_fee.paid_amount
        >= student_fee.amount
    ):
        student_fee.status = FeeStatus.PAID
    else:
        student_fee.status = FeeStatus.PARTIAL

    # --------------------------------------------------------
    # Create payment notification
    # --------------------------------------------------------

    create_notification(
        db=db,
        user_id=student.user_id,
        title="Payment Successful",
        message=(
            f"Your payment of ₹{payment.amount:.2f} "
            "has been successfully completed."
        ),
        notification_type=NotificationType.PAYMENT,
    )

    # --------------------------------------------------------
    # Create audit log
    # --------------------------------------------------------

    create_audit_log(
        user_id=student.user_id,
        db=db,
        action="PAYMENT_SUCCESS",
        resource="payment",
        resource_id=payment.id,
        description=(
            f"Payment of ₹{payment.amount:.2f} "
            "completed successfully"
        ),
    )

    # --------------------------------------------------------
    # Save payment + notification + audit log
    # --------------------------------------------------------

    db.commit()

    # --------------------------------------------------------
    # Queue email after successful database commit
    # --------------------------------------------------------

    queue_notification_email(
        db=db,
        user_id=student.user_id,
        title="Payment Successful",
        message=(
            f"Your payment of ₹{payment.amount:.2f} "
            "has been successfully completed."
        ),
    )

    db.refresh(payment)

    return payment
# ============================================================
# 3. STUDENT PAYMENT HISTORY
# ============================================================

@router.get(
    "/my-payments",
    response_model=list[PaymentResponse],
)
def get_my_payments(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find Student profile
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
    # Get payments
    # --------------------------------------------------------

    payments = db.scalars(
        select(Payment)
        .join(
            StudentFee,
            Payment.student_fee_id
            == StudentFee.id,
        )
        .where(
            StudentFee.student_id
            == student.id
        )
        .order_by(
            Payment.created_at.desc()
        )
    ).all()

    return list(payments)

# ============================================================
# 4. ADMIN PAYMENT MANAGEMENT
# ============================================================

@router.get(
    "/admin/list",
)
def get_admin_payments(
    page: int = Query(
        default=1,
        ge=1,
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    status_filter: str | None = Query(
        default=None,
        max_length=20,
    ),
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Normalize status only when provided
    # --------------------------------------------------------

    selected_status = None

    if status_filter:
        normalized_status = (
            status_filter.strip().upper()
        )

        try:
            selected_status = PaymentStatus[
                normalized_status
            ]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid payment status. "
                    "Use CREATED, SUCCESS or FAILED."
                ),
            )

        allowed_statuses = {
            PaymentStatus.CREATED,
            PaymentStatus.SUCCESS,
            PaymentStatus.FAILED,
        }

        if selected_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid payment status",
            )

    # --------------------------------------------------------
    # Base query
    # --------------------------------------------------------

    query = (
        select(
            Payment,
            Student,
            User,
        )
        .join(
            StudentFee,
            Payment.student_fee_id
            == StudentFee.id,
        )
        .join(
            Student,
            StudentFee.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id
            == User.id,
        )
    )

        # --------------------------------------------------------
    # Search filter
    # --------------------------------------------------------

    search = search.strip() if search else None

    if search:
        search_value = f"%{search}%"

        query = query.where(
            (
                User.full_name.ilike(
                    search_value
                )
            )
            | (
                User.email.ilike(
                    search_value
                )
            )
            | (
                Student.enrollment_no.ilike(
                    search_value
                )
            )
            | (
                Payment.razorpay_order_id.ilike(
                    search_value
                )
            )
            | (
                Payment.razorpay_payment_id.ilike(
                    search_value
                )
            )
        )

    # --------------------------------------------------------
    # Status filter
    # --------------------------------------------------------

    if selected_status is not None:
        query = query.where(
            Payment.status
            == selected_status
        )

    # --------------------------------------------------------
    # Count query
    # --------------------------------------------------------

    count_query = (
        select(
            func.count(Payment.id)
        )
        .join(
            StudentFee,
            Payment.student_fee_id
            == StudentFee.id,
        )
        .join(
            Student,
            StudentFee.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id
            == User.id,
        )
    )

    # --------------------------------------------------------
    # Apply search to count
    # --------------------------------------------------------

    if search:
        search_value = (
            f"%{search.strip()}%"
        )

        count_query = count_query.where(
            (
                User.full_name.ilike(
                    search_value
                )
            )
            | (
                User.email.ilike(
                    search_value
                )
            )
            | (
                Student.enrollment_no.ilike(
                    search_value
                )
            )
            | (
                Payment.razorpay_order_id.ilike(
                    search_value
                )
            )
            | (
                Payment.razorpay_payment_id.ilike(
                    search_value
                )
            )
        )

    # --------------------------------------------------------
    # Apply status to count
    # --------------------------------------------------------

    if selected_status is not None:
        count_query = count_query.where(
            Payment.status
            == selected_status
        )

    # --------------------------------------------------------
    # Total matching records
    # --------------------------------------------------------

    total = (
        db.scalar(count_query)
        or 0
    )

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    offset = (
        page - 1
    ) * limit

    payments = db.execute(
        query
        .order_by(
            Payment.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    ).all()

    # --------------------------------------------------------
    # Prepare response
    # --------------------------------------------------------

    records = []

    for payment, student, user in payments:
        records.append(
            {
                "payment_id": payment.id,
                "student_id": student.id,
                "student_name": user.full_name,
                "student_email": user.email,
                "enrollment_no": (
                    student.enrollment_no
                ),
                "student_fee_id": (
                    payment.student_fee_id
                ),
                "amount": float(
                    payment.amount
                ),
                "currency": payment.currency,
                "status": (
                    payment.status.value
                    if hasattr(
                        payment.status,
                        "value",
                    )
                    else str(
                        payment.status
                    )
                ),
                "razorpay_order_id": (
                    payment.razorpay_order_id
                ),
                "razorpay_payment_id": (
                    payment.razorpay_payment_id
                ),
                "paid_at": payment.paid_at,
                "created_at": payment.created_at,
            }
        )

    # --------------------------------------------------------
    # Payment statistics
    # --------------------------------------------------------

    total_transactions = db.scalar(
        select(
            func.count(Payment.id)
        )
    ) or 0

    successful_transactions = db.scalar(
        select(
            func.count(Payment.id)
        ).where(
            Payment.status
            == PaymentStatus.SUCCESS
        )
    ) or 0

    pending_transactions = db.scalar(
        select(
            func.count(Payment.id)
        ).where(
            Payment.status
            == PaymentStatus.CREATED
        )
    ) or 0

    failed_transactions = db.scalar(
        select(
            func.count(Payment.id)
        ).where(
            Payment.status
            == PaymentStatus.FAILED
        )
    ) or 0

    total_collected = db.scalar(
        select(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        ).where(
            Payment.status
            == PaymentStatus.SUCCESS
        )
    ) or 0

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "data": records,

        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (
                (
                    total + limit - 1
                ) // limit
                if total > 0
                else 0
            ),
        },

        "statistics": {
            "total_transactions": (
                total_transactions
            ),
            "successful_transactions": (
                successful_transactions
            ),
            "pending_transactions": (
                pending_transactions
            ),
            "failed_transactions": (
                failed_transactions
            ),
            "total_collected": float(
                total_collected
            ),
        },
    }
# ============================================================
# 5. DOWNLOAD PDF RECEIPT
# ============================================================

@router.get(
    "/{payment_id}/receipt",
)
def download_receipt(
    payment_id: int,
    current_user: User = Depends(
        require_roles(
            "student",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find payment
    # --------------------------------------------------------

    payment = db.get(
        Payment,
        payment_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    # --------------------------------------------------------
    # Receipt only for successful payment
    # --------------------------------------------------------

    if payment.status != PaymentStatus.SUCCESS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Receipt available only for "
                "successful payments"
            ),
        )

    # --------------------------------------------------------
    # Find StudentFee
    # --------------------------------------------------------

    student_fee = db.get(
        StudentFee,
        payment.student_fee_id,
    )

    if student_fee is None:
        raise HTTPException(
            status_code=404,
            detail="Student fee not found",
        )

    # --------------------------------------------------------
    # Find Student profile
    # --------------------------------------------------------

    student = db.get(
        Student,
        student_fee.student_id,
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Find User
    # --------------------------------------------------------

    student_user = db.get(
        User,
        student.user_id,
    )

    if student_user is None:
        raise HTTPException(
            status_code=404,
            detail="Student user not found",
        )

    # --------------------------------------------------------
    # Student can download only own receipt
    # --------------------------------------------------------

    if (
        current_user.role.value == "student"
        and current_user.id != student.user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Unauthorized",
        )

    # --------------------------------------------------------
    # Generate PDF
    # --------------------------------------------------------

    pdf = generate_receipt_pdf(
        student_name=student_user.full_name,
        email=student_user.email,
        payment_id=(
            payment.razorpay_payment_id
            or "N/A"
        ),
        order_id=payment.razorpay_order_id,
        amount=str(payment.amount),
        paid_at=str(payment.paid_at),
    )

    # --------------------------------------------------------
    # Return PDF
    # --------------------------------------------------------

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f"attachment; "
                f"filename=fee_receipt_{payment.id}.pdf"
        },
    )


# ============================================================
# 6. RAZORPAY WEBHOOK
# ============================================================

@router.post(
    "/webhook",
)
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Get raw body
    # --------------------------------------------------------

    body = await request.body()

    # --------------------------------------------------------
    # Get Razorpay signature
    # --------------------------------------------------------

    signature = request.headers.get(
        "X-Razorpay-Signature"
    )

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing webhook signature",
        )

    # --------------------------------------------------------
    # Check webhook secret
    # --------------------------------------------------------

    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail=(
                "Razorpay webhook secret "
                "is not configured"
            ),
        )

    # --------------------------------------------------------
    # Generate expected signature
    # --------------------------------------------------------

    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    # --------------------------------------------------------
    # Compare signatures
    # --------------------------------------------------------

    if not hmac.compare_digest(
        expected_signature,
        signature,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook signature",
        )

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    payload = await request.json()

    event = payload.get("event")

    # ========================================================
    # PAYMENT CAPTURED
    # ========================================================

    if event == "payment.captured":

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        razorpay_payment_id = (
            payment_entity.get("id")
        )

        razorpay_order_id = (
            payment_entity.get("order_id")
        )

        if not razorpay_order_id:
            return {
                "status": "ignored",
                "message": "Order ID missing",
            }

        # ----------------------------------------------------
        # Find payment
        # ----------------------------------------------------

        payment = db.scalar(
            select(Payment).where(
                Payment.razorpay_order_id
                == razorpay_order_id
            )
        )

        if payment is None:
            return {
                "status": "ignored",
                "message": "Payment not found",
            }

        # ----------------------------------------------------
        # Prevent duplicate webhook
        # ----------------------------------------------------

        if payment.status == PaymentStatus.SUCCESS:
            return {
                "status": "already_processed",
            }

        # ----------------------------------------------------
        # Update payment
        # ----------------------------------------------------

        payment.razorpay_payment_id = (
            razorpay_payment_id
        )

        payment.status = PaymentStatus.SUCCESS
        payment.paid_at = datetime.utcnow()

        # ----------------------------------------------------
        # Find StudentFee
        # ----------------------------------------------------

        student_fee = db.get(
            StudentFee,
            payment.student_fee_id,
        )

        if student_fee:

            student_fee.paid_amount = (
                student_fee.paid_amount
                + payment.amount
            )

            if (
                student_fee.paid_amount
                >= student_fee.amount
            ):
                student_fee.status = FeeStatus.PAID
            else:
                student_fee.status = FeeStatus.PARTIAL

        db.commit()

        return {
            "status": "success",
            "message": (
                "Payment captured successfully"
            ),
        }

    # ========================================================
    # PAYMENT FAILED
    # ========================================================

    if event == "payment.failed":

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        razorpay_order_id = (
            payment_entity.get("order_id")
        )

        if razorpay_order_id:

            payment = db.scalar(
                select(Payment).where(
                    Payment.razorpay_order_id
                    == razorpay_order_id
                )
            )

            if payment:
                payment.status = (
                    PaymentStatus.FAILED
                )

                db.commit()

        return {
            "status": "failed",
            "message": (
                "Payment marked as failed"
            ),
        }

    # ========================================================
    # OTHER EVENTS
    # ========================================================

    return {
        "status": "ignored",
        "message": (
            f"Event '{event}' received"
        ),
    }