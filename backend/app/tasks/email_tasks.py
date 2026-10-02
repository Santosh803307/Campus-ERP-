from app.core.celery_app import celery_app
from app.services.email_service import send_notification_email


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_kwargs={"max_retries": 3},
)
def send_notification_email_task(
    self,
    to_email: str,
    title: str,
    message: str,
):
    """
    Send notification email in background.
    """

    success = send_notification_email(
        to_email=to_email,
        title=title,
        message=message,
    )

    if not success:
        raise RuntimeError(
            f"Failed to send email to {to_email}"
        )

    return {
        "success": True,
        "to_email": to_email,
        "title": title,
    }