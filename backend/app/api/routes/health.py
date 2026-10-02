from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.redis import redis_client


router = APIRouter(
    prefix="/api/health",
    tags=["Health"],
)


@router.get("/")
async def health_check():
    database_status = "disconnected"
    redis_status = "disconnected"

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "disconnected"

    try:
        await redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"

    return {
        "status": "success",
        "message": "Campus ERP API is running",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": database_status,
            "redis": redis_status,
        },
    }
