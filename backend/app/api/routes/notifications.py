from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles

from app.models.notification import Notification
from app.models.user import User

from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


# ============================================================
# 1. GET MY NOTIFICATIONS
# ============================================================

@router.get(
    "/my",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    current_user: User = Depends(
        require_roles(
            "student",
            "faculty",
            "hod",
            "library",
            "lab",
            "accounts",
            "warden",
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification)
        .where(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
    ).all()

    return list(notifications)


# ============================================================
# 2. GET UNREAD NOTIFICATION COUNT
# ============================================================

@router.get(
    "/unread-count",
)
def get_unread_count(
    current_user: User = Depends(
        require_roles(
            "student",
            "faculty",
            "hod",
            "library",
            "lab",
            "accounts",
            "warden",
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    count = db.scalar(
        select(
            func.count(Notification.id)
        ).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    )

    return {
        "unread_count": count or 0,
    }


# ============================================================
# 3. MARK ONE NOTIFICATION AS READ
# ============================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(
        require_roles(
            "student",
            "faculty",
            "hod",
            "library",
            "lab",
            "accounts",
            "warden",
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    notification = db.get(
        Notification,
        notification_id,
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    # Security check:
    # User can only modify their own notification
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized notification access",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# 4. MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.patch(
    "/read-all",
)
def mark_all_notifications_read(
    current_user: User = Depends(
        require_roles(
            "student",
            "faculty",
            "hod",
            "library",
            "lab",
            "accounts",
            "warden",
            "security",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated": len(notifications),
    }


# ============================================================
# 5. CREATE NOTIFICATION
# ============================================================

@router.post(
    "",
    response_model=NotificationResponse,
    status_code=201,
)
def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Check target user exists
    # --------------------------------------------------------

    user = db.get(
        User,
        data.user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Create notification
    # --------------------------------------------------------

    notification = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification