from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "campus_erp",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.email_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    timezone="Asia/Kolkata",
    enable_utc=False,

    task_track_started=True,

    task_time_limit=120,
    task_soft_time_limit=90,

    worker_prefetch_multiplier=1,

    task_acks_late=True,

    broker_connection_retry_on_startup=True,
)