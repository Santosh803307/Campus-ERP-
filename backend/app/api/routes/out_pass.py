from datetime import datetime
from io import BytesIO
import secrets

import qrcode

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import StreamingResponse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_roles,
)

from app.models.user import User
from app.models.student import Student

from app.models.notification import NotificationType
from app.models.out_pass import (
    OutPass,
    OutPassScanLog,
    OutPassStatus,
)

from app.schemas.out_pass import (
    OutPassCreateRequest,
    OutPassResponse,
    OutPassApprovalRequest,
    OutPassScanRequest,
    OutPassScanResponse,
    OutPassScanLogResponse,
    OutPassVerificationResponse,
)

from app.services.notification_service import (
    create_notification,
    queue_notification_email,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/out-pass",
    tags=["Out-Pass"],
)


# =========================================================
# STUDENT — APPLY FOR OUT-PASS
# =========================================================

@router.post(
    "/apply",
    response_model=OutPassResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_out_pass(
    request: OutPassCreateRequest,
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

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # -----------------------------------------------------
    # Validate return time
    # -----------------------------------------------------

    if (
        request.expected_return_time
        <= request.departure_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Expected return time must be "
                "after departure time"
            ),
        )

    # -----------------------------------------------------
    # Check active Out-Pass
    # -----------------------------------------------------

    active_pass = db.scalar(
        select(OutPass).where(
            OutPass.student_id == student.id,
            OutPass.status.in_(
                [
                    OutPassStatus.PENDING,
                    OutPassStatus.APPROVED,
                    OutPassStatus.USED,
                ]
            ),
        )
    )

    if active_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You already have an active "
                "Out-Pass request. "
                "Please complete or cancel it "
                "before applying again."
            ),
        )

    # -----------------------------------------------------
    # Generate QR token
    # -----------------------------------------------------

    qr_token = secrets.token_urlsafe(32)

    out_pass = OutPass(
        student_id=student.id,
        reason=request.reason,
        destination=request.destination,
        emergency_contact=request.emergency_contact,
        departure_time=request.departure_time,
        expected_return_time=request.expected_return_time,
        status=OutPassStatus.PENDING,
        qr_token=qr_token,
    )

    db.add(out_pass)

    db.commit()

    db.refresh(out_pass)

    return out_pass


# =========================================================
# STUDENT — GET MY OUT-PASSES
# =========================================================

@router.get(
    "/my",
    response_model=list[OutPassResponse],
)
def get_my_out_passes(
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

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    passes = db.scalars(
        select(OutPass)
        .where(
            OutPass.student_id == student.id
        )
        .order_by(
            OutPass.created_at.desc()
        )
    ).all()

    return list(passes)


# =========================================================
# SECURITY / WARDEN / ADMIN — VERIFY OUT-PASS
# =========================================================

@router.get(
    "/{out_pass_id}/verify",
    response_model=OutPassVerificationResponse,
)
def verify_out_pass(
    out_pass_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    out_pass = db.get(
        OutPass,
        out_pass_id,
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Out-Pass not found",
        )

    allowed_staff_roles = [
        "security",
        "warden",
        "admin",
    ]

    if current_user.role.value == "student":

        student = db.scalar(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        if (
            student is None
            or out_pass.student_id != student.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to verify this Out-Pass"
                ),
            )

    elif current_user.role.value not in allowed_staff_roles:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to verify this Out-Pass"
            ),
        )

    # -----------------------------------------------------
    # Get Student
    # -----------------------------------------------------

    student = db.get(
        Student,
        out_pass.student_id,
    )

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    student_user = db.get(
        User,
        student.user_id,
    )

    if student_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student user not found",
        )

    # -----------------------------------------------------
    # Get Latest Scan
    # -----------------------------------------------------

    latest_scan = db.scalar(
        select(OutPassScanLog)
        .where(
            OutPassScanLog.out_pass_id
            == out_pass.id
        )
        .order_by(
            OutPassScanLog.scanned_at.desc()
        )
    )

    latest_scan_data = None

    if latest_scan:
        latest_scan_data = {
            "scan_type": latest_scan.scan_type,
            "scanned_at": latest_scan.scanned_at,
            "scanned_by": latest_scan.scanned_by,
            "remarks": latest_scan.remarks,
        }

    return {
        "out_pass_id": out_pass.id,
        "status": out_pass.status.value,
        "reason": out_pass.reason,
        "destination": out_pass.destination,
        "emergency_contact": (
            out_pass.emergency_contact
        ),
        "departure_time": (
            out_pass.departure_time
        ),
        "expected_return_time": (
            out_pass.expected_return_time
        ),
        "approved_by": out_pass.approved_by,
        "approved_at": out_pass.approved_at,

        "student": {
            "id": student.id,
            "user_id": student.user_id,
            "name": student_user.full_name,
            "email": student_user.email,
            "enrollment_no": (
                student.enrollment_no
            ),
            "course": student.course,
            "semester": student.semester,
            "department_id": (
                student.department_id
            ),
        },

        "latest_scan": latest_scan_data,
    }


# =========================================================
# STUDENT / STAFF — GET SINGLE OUT-PASS
# =========================================================

@router.get(
    "/{out_pass_id}",
    response_model=OutPassResponse,
)
def get_out_pass(
    out_pass_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    out_pass = db.get(
        OutPass,
        out_pass_id,
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Out-Pass not found",
        )

    if current_user.role.value == "student":

        student = db.scalar(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        if (
            student is None
            or out_pass.student_id != student.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to view this Out-Pass"
                ),
            )

    elif current_user.role.value not in [
        "warden",
        "security",
        "admin",
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to view this Out-Pass"
            ),
        )

    return out_pass


# =========================================================
# WARDEN / ADMIN — PENDING OUT-PASSES
# =========================================================

@router.get(
    "/pending/list",
)
def get_pending_out_passes(
    current_user: User = Depends(
        require_roles(
            "warden",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    results = db.execute(
        select(
            OutPass,
            Student.enrollment_no,
            Student.course,
            Student.semester,
            User.full_name.label(
                "student_name"
            ),
            User.email.label(
                "student_email"
            ),
        )
        .join(
            Student,
            OutPass.student_id == Student.id,
        )
        .join(
            User,
            Student.user_id == User.id,
        )
        .where(
            OutPass.status
            == OutPassStatus.PENDING
        )
        .order_by(
            OutPass.created_at.asc()
        )
    ).all()

    response = []

    for (
        out_pass,
        enrollment_no,
        course,
        semester,
        student_name,
        student_email,
    ) in results:

        response.append(
            {
                "id": out_pass.id,
                "student_id": (
                    out_pass.student_id
                ),
                "student_name": student_name,
                "student_email": student_email,
                "enrollment_no": enrollment_no,
                "course": course,
                "semester": semester,
                "reason": out_pass.reason,
                "destination": (
                    out_pass.destination
                ),
                "emergency_contact": (
                    out_pass.emergency_contact
                ),
                "departure_time": (
                    out_pass.departure_time
                ),
                "expected_return_time": (
                    out_pass.expected_return_time
                ),
                "status": (
                    out_pass.status.value
                ),
                "created_at": (
                    out_pass.created_at
                ),
            }
        )

    return response


# =========================================================
# WARDEN / ADMIN — APPROVE / REJECT
# =========================================================

@router.patch(
    "/{out_pass_id}/approval",
    response_model=OutPassResponse,
)
def update_out_pass_approval(
    out_pass_id: int,
    request: OutPassApprovalRequest,
    current_user: User = Depends(
        require_roles(
            "warden",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    out_pass = db.get(
        OutPass,
        out_pass_id,
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Out-Pass not found",
        )

    # Only pending requests can be processed
    if out_pass.status != OutPassStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only pending Out-Pass requests "
                "can be approved or rejected"
            ),
        )

    action = request.status.lower().strip()

    if action not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Status must be either "
                "'approved' or 'rejected'"
            ),
        )

    # =====================================================
    # Find student for notification
    # =====================================================

    student = db.get(
        Student,
        out_pass.student_id,
    )

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # =====================================================
    # REJECT
    # =====================================================

    if action == "rejected":

        if (
            not request.remarks
            or not request.remarks.strip()
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Remarks are required when "
                    "rejecting an Out-Pass"
                ),
            )

        out_pass.status = (
            OutPassStatus.REJECTED
        )

        out_pass.rejected_reason = (
            request.remarks.strip()
        )

        out_pass.approved_by = (
            current_user.id
        )

        out_pass.approved_at = (
            datetime.utcnow()
        )

        # -------------------------------------------------
        # Notification — rejected
        # -------------------------------------------------

        create_notification(
            db=db,
            user_id=student.user_id,
            title="Out-Pass Rejected",
            message=(
                "Your hostel out-pass has been "
                "rejected. "
                f"Reason: {out_pass.rejected_reason}"
            ),
            notification_type=(
                NotificationType.OUT_PASS
            ),
        )

    # =====================================================
    # APPROVE
    # =====================================================

    else:

        out_pass.status = (
            OutPassStatus.APPROVED
        )

        out_pass.approved_by = (
            current_user.id
        )

        out_pass.approved_at = (
            datetime.utcnow()
        )

        out_pass.rejected_reason = None

        # -------------------------------------------------
        # Notification — approved
        # -------------------------------------------------

        create_notification(
            db=db,
            user_id=student.user_id,
            title="Out-Pass Approved",
            message=(
                f"Your hostel out-pass for "
                f"{out_pass.destination} "
                "has been approved."
            ),
            notification_type=(
                NotificationType.OUT_PASS
            ),
        )

    # =====================================================
    # Audit Log
    # =====================================================

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=(
            "OUT_PASS_APPROVED"
            if action == "approved"
            else "OUT_PASS_REJECTED"
        ),
        resource="out_pass",
        resource_id=out_pass.id,
        description=(
            f"Out-Pass "
            f"{'approved' if action == 'approved' else 'rejected'} "
            f"by {current_user.email}"
        ),
    )

    # =====================================================
    # Save Out-Pass + Notification
    # =====================================================

    db.commit()

    # =====================================================
    # Queue Email Notification
    # =====================================================

    if action == "rejected":

        queue_notification_email(
            db=db,
            user_id=student.user_id,
            title="Out-Pass Rejected",
            message=(
                "Your hostel out-pass has been "
                "rejected. "
                f"Reason: {out_pass.rejected_reason}"
            ),
        )

    else:

        queue_notification_email(
            db=db,
            user_id=student.user_id,
            title="Out-Pass Approved",
            message=(
                f"Your hostel out-pass for "
                f"{out_pass.destination} "
                "has been approved."
            ),
        )

    db.refresh(out_pass)

    return out_pass


# =========================================================
# STUDENT / WARDEN / SECURITY / ADMIN — GENERATE QR
# =========================================================

@router.get(
    "/{out_pass_id}/qr",
)
def generate_out_pass_qr(
    out_pass_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    out_pass = db.get(
        OutPass,
        out_pass_id,
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Out-Pass not found",
        )

    if current_user.role.value == "student":

        student = db.scalar(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        if (
            student is None
            or out_pass.student_id != student.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this QR"
                ),
            )

    elif current_user.role.value not in [
        "warden",
        "security",
        "admin",
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to access this QR"
            ),
        )

    if out_pass.status not in [
        OutPassStatus.APPROVED,
        OutPassStatus.USED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "QR is available only for "
                "an approved Out-Pass"
            ),
        )

    if not out_pass.qr_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR token not available",
        )

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )

    qr.add_data(
        out_pass.qr_token
    )

    qr.make(
        fit=True
    )

    image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    buffer = BytesIO()

    image.save(
        buffer,
        format="PNG",
    )

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": (
                f'inline; filename='
                f'"out-pass-{out_pass.id}-qr.png"'
            )
        },
    )


# =========================================================
# SECURITY / ADMIN — SCAN OUT-PASS
# =========================================================

@router.post(
    "/scan",
    response_model=OutPassScanResponse,
)
def scan_out_pass(
    request: OutPassScanRequest,
    current_user: User = Depends(
        require_roles(
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Validate scan type
    # -----------------------------------------------------

    scan_type = request.scan_type.lower().strip()

    if scan_type not in [
        "exit",
        "entry",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Scan type must be either "
                "'exit' or 'entry'"
            ),
        )

    # -----------------------------------------------------
    # Find Out-Pass using QR token
    # -----------------------------------------------------

    out_pass = db.scalar(
        select(OutPass)
        .where(
            OutPass.qr_token
            == request.qr_token
        )
        .with_for_update()
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid QR code",
        )

    # -----------------------------------------------------
    # QR allowed only after approval
    # -----------------------------------------------------

    if out_pass.status in [
        OutPassStatus.PENDING,
        OutPassStatus.REJECTED,
        OutPassStatus.CANCELLED,
        OutPassStatus.EXPIRED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This Out-Pass is not valid. "
                f"Current status: "
                f"{out_pass.status.value}"
            ),
        )

    
    # -----------------------------------------------------
    # Check Out-Pass expiry
    # -----------------------------------------------------

    now = datetime.utcnow()

    # Only an APPROVED pass can expire before EXIT.
    # A USED pass must still be allowed to scan ENTRY,
    # even if the student returns late.
    if (
        out_pass.status == OutPassStatus.APPROVED
        and out_pass.expected_return_time < now
    ):
        out_pass.status = OutPassStatus.EXPIRED

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This Out-Pass has expired. "
                "Expected return time has passed."
            ),
        )

    # -----------------------------------------------------
    # Get latest scan
    # -----------------------------------------------------

    last_scan = db.scalar(
        select(OutPassScanLog)
        .where(
            OutPassScanLog.out_pass_id
            == out_pass.id
        )
        .order_by(
            OutPassScanLog.scanned_at.desc()
        )
    )

    # =====================================================
    # EXIT SCAN
    # =====================================================

    if scan_type == "exit":

        if (
            out_pass.status
            != OutPassStatus.APPROVED
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Exit scan is not allowed. "
                    f"Current Out-Pass status: "
                    f"{out_pass.status.value}"
                ),
            )

        if (
            last_scan
            and last_scan.scan_type
            == "exit"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Exit scan already recorded"
                ),
            )

        out_pass.status = (
            OutPassStatus.USED
        )

        scan_log = OutPassScanLog(
            out_pass_id=out_pass.id,
            scanned_by=current_user.id,
            scan_type="exit",
            remarks=(
                "Student exited through "
                "security gate"
            ),
        )

        db.add(scan_log)
        create_audit_log(
            db=db,        
            user_id=current_user.id,
            action="OUT_PASS_EXIT_SCAN",
            resource="out_pass",
            resource_id=out_pass.id,
            description=(
                f"Out-Pass EXIT scanned by "
                f"{current_user.email}"
            ),
        ) 

        db.commit()

        db.refresh(scan_log)

        return OutPassScanResponse(
            success=True,
            message=(
                "Exit scan successful. "
                "Student has exited."
            ),
            out_pass_id=out_pass.id,
            scan_type="exit",
            scanned_at=scan_log.scanned_at,
        )

    # =====================================================
    # ENTRY SCAN
    # =====================================================

    if scan_type == "entry":

        if (
            out_pass.status
            != OutPassStatus.USED
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Entry scan is not allowed. "
                    f"Current Out-Pass status: "
                    f"{out_pass.status.value}. "
                    "Student must complete an "
                    "exit scan first."
                ),
            )

        if (
            last_scan
            and last_scan.scan_type
            == "entry"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Entry scan already recorded"
                ),
            )

        scan_log = OutPassScanLog(
            out_pass_id=out_pass.id,
            scanned_by=current_user.id,
            scan_type="entry",
            remarks=(
                "Student returned through "
                "security gate"
            ),
        )

        out_pass.status = (
            OutPassStatus.RETURNED
        )

        db.add(scan_log)

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="OUT_PASS_ENTRY_SCAN",
            resource="out_pass",
            resource_id=out_pass.id,
            description=(
                f"Out-Pass ENTRY scanned by "
                f"{current_user.email}"
            ),
        )

        db.commit()

        db.refresh(scan_log)

        return OutPassScanResponse(
            success=True,
            message=(
                "Entry scan successful. "
                "Student returned to campus."
            ),
            out_pass_id=out_pass.id,
            scan_type="entry",
            scanned_at=scan_log.scanned_at,
        )


# =========================================================
# STUDENT / SECURITY / WARDEN / ADMIN — SCAN LOGS
# =========================================================

@router.get(
    "/scan/logs/{out_pass_id}",
    response_model=list[OutPassScanLogResponse],
)
def get_out_pass_scan_logs(
    out_pass_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    out_pass = db.get(
        OutPass,
        out_pass_id,
    )

    if out_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Out-Pass not found",
        )

    if current_user.role.value == "student":

        student = db.scalar(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        if (
            student is None
            or out_pass.student_id
            != student.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to view these logs"
                ),
            )

    elif current_user.role.value not in [
        "security",
        "warden",
        "admin",
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to view scan logs"
            ),
        )

    logs = db.scalars(
        select(OutPassScanLog)
        .where(
            OutPassScanLog.out_pass_id
            == out_pass_id
        )
        .order_by(
            OutPassScanLog.scanned_at.desc()
        )
    ).all()

    return list(logs)


# =========================================================
# SECURITY / ADMIN — RECENT SCAN HISTORY
# =========================================================

@router.get(
    "/scan/recent",
)
def get_recent_security_scans(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    current_user: User = Depends(
        require_roles(
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    results = db.execute(
        select(
            OutPassScanLog,
            OutPass,
            Student,
            User,
        )
        .join(
            OutPass,
            OutPassScanLog.out_pass_id
            == OutPass.id,
        )
        .join(
            Student,
            OutPass.student_id
            == Student.id,
        )
        .join(
            User,
            Student.user_id
            == User.id,
        )
        .order_by(
            OutPassScanLog.scanned_at.desc()
        )
        .limit(limit)
    ).all()

    response = []

    for (
        scan_log,
        out_pass,
        student,
        student_user,
    ) in results:

        response.append(
            {
                "scan_id": scan_log.id,
                "out_pass_id": out_pass.id,
                "student_id": student.id,
                "student_name": (
                    student_user.full_name
                ),
                "student_email": (
                    student_user.email
                ),
                "enrollment_no": (
                    student.enrollment_no
                ),
                "course": student.course,
                "semester": student.semester,
                "destination": (
                    out_pass.destination
                ),
                "scan_type": (
                    scan_log.scan_type
                ),
                "scanned_at": (
                    scan_log.scanned_at
                ),
                "scanned_by": (
                    scan_log.scanned_by
                ),
                "remarks": (
                    scan_log.remarks
                ),
            }
        )

    return response