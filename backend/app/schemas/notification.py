from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: NotificationType = (
        NotificationType.GENERAL
    )