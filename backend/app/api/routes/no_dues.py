from datetime import datetime

from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.services.notification_service import (
    create_notification,
    queue_notification_email,
)
from app.models.notification import NotificationType

from app.core.database import get_db
from app.models.department import Department
from app.core.security import get_current_user
from app.core.security import require_roles
from app.models.user import User
from app.models.student import Student
from app.models.no_dues import (
    NoDuesRequest,
    NoDuesApproval,
    NoDuesStatus,
    NoDuesDepartment,
)
from app.schemas.no_dues import (
    NoDuesApplyRequest,
    NoDuesApprovalRequest,
    NoDuesResponse,
    NoDuesApprovalResponse,
)
from app.services.no_dues_certificate_service import (
    generate_no_dues_certificate,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/no-dues",
    tags=["No-Dues"],
)


# ============================================================
# 1. STUDENT - APPLY FOR NO-DUES
# ============================================================

@router.post(
    "/apply",
    response_model=NoDuesResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_for_no_dues(
    request: NoDuesApplyRequest,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Student can apply for No-Dues.
    """

    # --------------------------------------------------------
    # Find student profile
    # --------------------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Check existing active request
    # --------------------------------------------------------

    existing_request = db.scalar(
        select(NoDuesRequest).where(
            NoDuesRequest.student_id == student.id,
            NoDuesRequest.status.in_(
                [
                    NoDuesStatus.PENDING,
                    NoDuesStatus.IN_PROGRESS,
                ]
            ),
        )
    )

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active No-Dues request.",
        )

    # --------------------------------------------------------
    # Create request
    # --------------------------------------------------------

    no_dues_request = NoDuesRequest(
        student_id=student.id,
        status=NoDuesStatus.IN_PROGRESS,
        reason=request.reason,
    )

    db.add(no_dues_request)

    db.flush()

    # --------------------------------------------------------
    # Create approval entries for all departments
    # --------------------------------------------------------

    departments = [
        NoDuesDepartment.LIBRARY,
        NoDuesDepartment.ACCOUNTS,
        NoDuesDepartment.HOSTEL,
        NoDuesDepartment.LAB,
        NoDuesDepartment.DEPARTMENT,
    ]

    for department in departments:

        approval = NoDuesApproval(
            no_dues_request_id=no_dues_request.id,
            department=department,
            status=NoDuesStatus.PENDING,
        )

        db.add(approval)

    # --------------------------------------------------------
    # Notification: Application Submitted
    # --------------------------------------------------------

    create_notification(
        db=db,
        user_id=student.user_id,
        title="No-Dues Application Submitted",
        message=(
            "Your No-Dues application has been "
            "submitted successfully. "
            "It is now waiting for approval from "
            "the required departments."
        ),
        notification_type=(
            NotificationType.NO_DUES
        ),
    )

    create_audit_log(
        db=db,
        user_id=student.user_id,
        action="NO_DUES_APPLIED",
        resource="no_dues",
        resource_id=no_dues_request.id,
        description="Student submitted a No-Dues application",
    )

    # --------------------------------------------------------
    # Save request + approvals + notification
    # --------------------------------------------------------
    db.commit()

    # --------------------------------------------------------
    # Queue email after successful DB commit
    # --------------------------------------------------------

    queue_notification_email(
        db=db,
        user_id=student.user_id,
        title="No-Dues Application Submitted",
        message=(
            "Your No-Dues application has been "
            "submitted successfully. "
            "It is now waiting for approval from "
            "the required departments."
        ),
    )

    db.refresh(no_dues_request)

    return no_dues_request


# ============================================================
# 2. STUDENT - MY NO-DUES REQUEST
# ============================================================

@router.get("/my-request")
def get_my_no_dues_request(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    """
    Student can view their latest No-Dues request.
    """

    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # Temporary debugging
    db_info = db.execute(
        text(
            "SELECT current_database(), current_user"
        )
    ).fetchone()

    debug_rows = db.execute(
        text("""
            SELECT
                id,
                student_id,
                status,
                applied_at
            FROM no_dues_requests
            ORDER BY id DESC
        """)
    ).fetchall()

    debug_schema = db.execute(
        text(
            "SELECT current_schema(), current_schemas(true)"
        )
    ).fetchone()

    print("DEBUG DB:", db_info)
    print("DEBUG SCHEMA:", debug_schema)
    print("DEBUG RAW ROWS:", debug_rows)

    # Latest request of this student
    request = db.scalar(
        select(NoDuesRequest)
        .where(
            NoDuesRequest.student_id == student.id
        )
        .order_by(
            NoDuesRequest.id.desc()
        )
    )

    print(
        "DEBUG NO-DUES:",
        "student_id =", student.id,
        "request_id =", request.id if request else None,
        "status =", request.status if request else None,
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="No-Dues request not found",
        )

    approvals = db.scalars(
        select(NoDuesApproval)
        .where(
            NoDuesApproval.no_dues_request_id
            == request.id
        )
        .order_by(
            NoDuesApproval.id
        )
    ).all()

    return {
        "request": NoDuesResponse.model_validate(
            request
        ),
        "approvals": [
            NoDuesApprovalResponse.model_validate(
                approval
            )
            for approval in approvals
        ],
    }

# ============================================================
# 4. DEPARTMENT STAFF - PENDING REQUESTS
# ============================================================

@router.get(
    "/pending/list",
)
def get_pending_no_dues_requests(
    current_user: User = Depends(
        require_roles(
            "admin",
            "hod",
            "library",
            "lab",
            "warden",
            "accounts",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Department staff can view pending No-Dues requests.
    """

    role_department_map = {
        "library": NoDuesDepartment.LIBRARY,
        "accounts": NoDuesDepartment.ACCOUNTS,
        "warden": NoDuesDepartment.HOSTEL,
        "lab": NoDuesDepartment.LAB,
        "hod": NoDuesDepartment.DEPARTMENT,
    }

    # --------------------------------------------------------
    # Admin can see everything
    # --------------------------------------------------------

    if current_user.role.value == "admin":

        approvals = db.scalars(
            select(NoDuesApproval).where(
                NoDuesApproval.status
                == NoDuesStatus.PENDING
            )
        ).all()

    else:

        department = role_department_map.get(
            current_user.role.value
        )

        if not department:
            raise HTTPException(
                status_code=403,
                detail=(
                    "No-Dues department access "
                    "not configured"
                ),
            )

        approvals = db.scalars(
            select(NoDuesApproval).where(
                NoDuesApproval.department
                == department,
                NoDuesApproval.status
                == NoDuesStatus.PENDING,
            )
        ).all()

    result = []

    for approval in approvals:

        no_dues_request = db.scalar(
            select(NoDuesRequest).where(
                NoDuesRequest.id
                == approval.no_dues_request_id
            )
        )

        if not no_dues_request:
            continue

        student = db.scalar(
            select(Student).where(
                Student.id
                == no_dues_request.student_id
            )
        )

        student_user = None

        if student:
            student_user = db.scalar(
                select(User).where(
                    User.id == student.user_id
                )
            )

        result.append(
            {
                "request_id": no_dues_request.id,
                "approval_id": approval.id,
                "student_id": (
                    student.id
                    if student
                    else None
                ),
                "student_name": (
                    student_user.full_name
                    if student_user
                    else None
                ),
                "enrollment_no": (
                    student.enrollment_no
                    if student
                    else None
                ),
                "department": (
                    approval.department.value
                ),
                "status": (
                    approval.status.value
                ),
                "reason": (
                    no_dues_request.reason
                ),
                "applied_at": (
                    no_dues_request.applied_at
                ),
            }
        )

    return result


# ============================================================
# 5. DEPARTMENT STAFF - APPROVE / REJECT
# ============================================================

@router.patch(
    "/{request_id}/approval",
)
def update_no_dues_approval(
    request_id: int,
    request: NoDuesApprovalRequest,
    current_user: User = Depends(
        require_roles(
            "admin",
            "hod",
            "library",
            "lab",
            "warden",
            "accounts",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Department staff can approve or reject No-Dues.
    """

    # --------------------------------------------------------
    # Validate status
    # --------------------------------------------------------

    allowed_statuses = {
        "approved": NoDuesStatus.APPROVED,
        "rejected": NoDuesStatus.REJECTED,
    }

    new_status = allowed_statuses.get(
        request.status.lower()
    )

    if not new_status:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be either "
                "approved or rejected"
            ),
        )

    # --------------------------------------------------------
    # Find No-Dues request
    # --------------------------------------------------------

    no_dues_request = db.scalar(
        select(NoDuesRequest).where(
            NoDuesRequest.id == request_id
        )
    )

    if not no_dues_request:
        raise HTTPException(
            status_code=404,
            detail="No-Dues request not found",
        )

    # --------------------------------------------------------
    # Find Student
    # --------------------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.id
            == no_dues_request.student_id
        )
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Admin can select department from
    # existing pending approval
    # --------------------------------------------------------

    if current_user.role.value == "admin":

        approval = db.scalar(
            select(NoDuesApproval).where(
                NoDuesApproval.no_dues_request_id
                == request_id,
                NoDuesApproval.status
                == NoDuesStatus.PENDING,
            )
        )

    else:

        role_department_map = {
            "library": NoDuesDepartment.LIBRARY,
            "accounts": NoDuesDepartment.ACCOUNTS,
            "warden": NoDuesDepartment.HOSTEL,
            "lab": NoDuesDepartment.LAB,
            "hod": NoDuesDepartment.DEPARTMENT,
        }

        department = role_department_map.get(
            current_user.role.value
        )

        if not department:
            raise HTTPException(
                status_code=403,
                detail=(
                    "No-Dues department access "
                    "not configured"
                ),
            )

        approval = db.scalar(
            select(NoDuesApproval).where(
                NoDuesApproval.no_dues_request_id
                == request_id,
                NoDuesApproval.department
                == department,
            )
        )

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval record not found",
        )

    if approval.status != NoDuesStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=(
                "This department has already "
                "processed the request"
            ),
        )

    # --------------------------------------------------------
    # Update approval
    # --------------------------------------------------------

    approval.status = new_status

    approval.remarks = request.remarks

    approval.approved_by = current_user.id

    approval.approved_at = datetime.utcnow()

    db.flush()

    # --------------------------------------------------------
    # Get department display name
    # --------------------------------------------------------

    department_name_map = {
        NoDuesDepartment.LIBRARY: "Library",
        NoDuesDepartment.ACCOUNTS: "Accounts",
        NoDuesDepartment.HOSTEL: "Hostel",
        NoDuesDepartment.LAB: "Lab",
        NoDuesDepartment.DEPARTMENT: "Department",
    }

    department_name = department_name_map.get(
        approval.department,
        approval.department.value.title(),
    )

    # ========================================================
    # REJECTED
    # ========================================================

    if new_status == NoDuesStatus.REJECTED:

        no_dues_request.status = (
            NoDuesStatus.REJECTED
        )

        rejection_reason = (
            request.remarks.strip()
            if request.remarks
            and request.remarks.strip()
            else "No reason was provided."
        )

        create_notification(
            db=db,
            user_id=student.user_id,
            title=(
                f"No-Dues Rejected by "
                f"{department_name}"
            ),
            message=(
                f"Your No-Dues request has been "
                f"rejected by the {department_name} "
                f"department. "
                f"Reason: {rejection_reason}"
            ),
            notification_type=(
                NotificationType.NO_DUES
            ),
        )

    # ========================================================
    # APPROVED
    # ========================================================

    else:

        approvals = db.scalars(
            select(NoDuesApproval).where(
                NoDuesApproval.no_dues_request_id
                == request_id
            )
        ).all()

        all_approved = all(
            item.status == NoDuesStatus.APPROVED
            for item in approvals
        )

        if all_approved:

            no_dues_request.status = (
                NoDuesStatus.COMPLETED
            )

            no_dues_request.completed_at = (
                datetime.utcnow()
            )

            create_notification(
                db=db,
                user_id=student.user_id,
                title="No-Dues Completed 🎉",
                message=(
                    "Congratulations! All required "
                    "departments have approved your "
                    "No-Dues request. Your No-Dues "
                    "process is now completed and "
                    "your certificate is available "
                    "for download."
                ),
                notification_type=(
                    NotificationType.NO_DUES
                ),
            )

        else:

            no_dues_request.status = (
                NoDuesStatus.IN_PROGRESS
            )

            create_notification(
                db=db,
                user_id=student.user_id,
                title=(
                    f"No-Dues Approved by "
                    f"{department_name}"
                ),
                message=(
                    f"The {department_name} department "
                    "has approved your No-Dues request. "
                    "Your request is still waiting for "
                    "approval from the remaining departments."
                ),
                notification_type=(
                    NotificationType.NO_DUES
                ),
            )


    # ========================================================
    # AUDIT LOG
    # ========================================================

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=(
            "NO_DUES_APPROVED"
            if new_status == NoDuesStatus.APPROVED
            else "NO_DUES_REJECTED"
        ),
        resource="no_dues",
        resource_id=no_dues_request.id,
        description=(
            f"No-Dues department approval "
            f"{'approved' if new_status == NoDuesStatus.APPROVED else 'rejected'} "
            f"by {current_user.email}"
        ),
    )

    # ========================================================
    # SAVE APPROVAL + REQUEST + NOTIFICATION
    # ========================================================

    db.commit()

    # ========================================================
    # QUEUE EMAIL AFTER SUCCESSFUL DB COMMIT
    # ========================================================

    if new_status == NoDuesStatus.REJECTED:

        queue_notification_email(
            db=db,
            user_id=student.user_id,
            title=(
                f"No-Dues Rejected by "
                f"{department_name}"
            ),
            message=(
                f"Your No-Dues request has been "
                f"rejected by the {department_name} "
                f"department. "
                f"Reason: {rejection_reason}"
            ),
        )

    else:

        if no_dues_request.status == NoDuesStatus.COMPLETED:

            queue_notification_email(
                db=db,
                user_id=student.user_id,
                title="No-Dues Completed 🎉",
                message=(
                    "Congratulations! All required "
                    "departments have approved your "
                    "No-Dues request. Your No-Dues "
                    "process is now completed and "
                    "your certificate is available "
                    "for download."
                ),
            )

        else:

            queue_notification_email(
                db=db,
                user_id=student.user_id,
                title=(
                    f"No-Dues Approved by "
                    f"{department_name}"
                ),
                message=(
                    f"The {department_name} department "
                    "has approved your No-Dues request. "
                    "Your request is still waiting for "
                    "approval from the remaining departments."
                ),
            )

    return {
        "message": (
            "No-Dues approval updated successfully"
        ),
        "request_id": no_dues_request.id,
        "approval_id": approval.id,
        "status": approval.status.value,
        "overall_status": (
            no_dues_request.status.value
        ),
    }


# ============================================================
# 6. ADMIN - ALL NO-DUES REQUESTS
# ============================================================

@router.get(
    "/",
)
def get_all_no_dues_requests(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    """
    Admin can view all No-Dues requests.
    """

    requests = db.scalars(
        select(NoDuesRequest)
        .order_by(
            NoDuesRequest.id.desc()
        )
    ).all()

    result = []

    for no_dues_request in requests:

        approvals = db.scalars(
            select(NoDuesApproval).where(
                NoDuesApproval.no_dues_request_id
                == no_dues_request.id
            )
        ).all()

        result.append(
            {
                "request": (
                    NoDuesResponse.model_validate(
                        no_dues_request
                    )
                ),
                "approvals": [
                    NoDuesApprovalResponse.model_validate(
                        approval
                    )
                    for approval in approvals
                ],
            }
        )

    return result


# ============================================================
# 7. DOWNLOAD NO-DUES CERTIFICATE
# ============================================================

@router.get(
    "/{request_id}/certificate"
)
def download_no_dues_certificate(
    request_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------
    # Find No-Dues request
    # ---------------------------------------------

    no_dues_request = db.scalar(
        select(NoDuesRequest).where(
            NoDuesRequest.id == request_id
        )
    )

    if no_dues_request is None:
        raise HTTPException(
            status_code=404,
            detail="No-Dues request not found",
        )

    # ---------------------------------------------
    # Find student
    # ---------------------------------------------

    student = db.scalar(
        select(Student).where(
            Student.id
            == no_dues_request.student_id
        )
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # ---------------------------------------------
    # Authorization
    # ---------------------------------------------

    allowed_staff_roles = {
        "admin",
        "hod",
        "library",
        "accounts",
        "warden",
        "lab",
    }

    is_student_owner = (
        current_user.role.value == "student"
        and student.user_id == current_user.id
    )

    is_allowed_staff = (
        current_user.role.value
        in allowed_staff_roles
    )

    if (
        not is_student_owner
        and not is_allowed_staff
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to download this certificate"
            ),
        )

    # ---------------------------------------------
    # Certificate only after completion
    # ---------------------------------------------

    if (
        no_dues_request.status.value
        != "completed"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "No-Dues certificate is available "
                "only after all approvals are completed"
            ),
        )

    # ---------------------------------------------
    # Get student user
    # ---------------------------------------------

    student_user = db.scalar(
        select(User).where(
            User.id == student.user_id
        )
    )

    if student_user is None:
        raise HTTPException(
            status_code=404,
            detail="Student user not found",
        )

    # ---------------------------------------------
    # Get department
    # ---------------------------------------------

    department = db.scalar(
        select(Department).where(
            Department.id
            == student.department_id
        )
    )

    if department is None:
        raise HTTPException(
            status_code=404,
            detail="Student department not found",
        )

    # ---------------------------------------------
    # Get approvals
    # ---------------------------------------------

    approvals = db.scalars(
        select(NoDuesApproval)
        .where(
            NoDuesApproval.no_dues_request_id
            == no_dues_request.id
        )
        .order_by(
            NoDuesApproval.id
        )
    ).all()

    # ---------------------------------------------
    # Generate PDF
    # ---------------------------------------------

    pdf_buffer = generate_no_dues_certificate(
        request=no_dues_request,
        student=student,
        user=student_user,
        department=department,
        approvals=approvals,
    )

    filename = (
        f"No-Dues-Certificate-"
        f"{student.enrollment_no}-"
        f"{no_dues_request.id}.pdf"
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )