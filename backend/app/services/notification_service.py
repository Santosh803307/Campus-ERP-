from sqlalchemy.orm import Session

from app.models.notification import (
    Notification,
    NotificationType,
)

from app.models.user import User

from app.tasks.email_tasks import (
    send_notification_email_task,
)


# ============================================================
# CREATE IN-APP NOTIFICATION
# ============================================================

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
) -> Notification:
    """
    Create an in-app notification.

    IMPORTANT:
    This function only adds the notification to the
    current database transaction.

    The caller is responsible for db.commit().
    """

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )

    db.add(notification)

    return notification


# ============================================================
# QUEUE EMAIL AFTER DATABASE COMMIT
# ============================================================

def queue_notification_email(
    db: Session,
    user_id: int,
    title: str,
    message: str,
):
    """
    Queue notification email through Celery.

    This function should be called AFTER db.commit().

    Flow:

        FastAPI
           ↓
        Redis
           ↓
        Celery
           ↓
        Email Service
           ↓
        Gmail
    """

    user = db.get(
        User,
        user_id,
    )

    if user is None:
        print(
            f"[EMAIL QUEUE] User {user_id} not found"
        )
        return None

    if not user.email:
        print(
            f"[EMAIL QUEUE] User {user_id} "
            "does not have an email address"
        )
        return None

    try:

        task = send_notification_email_task.delay(
            user.email,
            title,
            message,
        )

        print(
            f"[EMAIL QUEUE] Email queued successfully "
            f"for {user.email} | "
            f"task_id={task.id}"
        )

        return task

    except Exception as error:

        print(
            f"[EMAIL QUEUE ERROR] "
            f"Could not queue email for "
            f"{user.email}: {error}"
        )

        return None