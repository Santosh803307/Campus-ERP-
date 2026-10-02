from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: str | None = None,
    resource: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN.value)
    ),
):
    offset = (page - 1) * limit

    query = select(AuditLog)

    if action:
        query = query.where(
            AuditLog.action == action
        )

    if resource:
        query = query.where(
            AuditLog.resource == resource
        )

    query = query.order_by(
        desc(AuditLog.created_at)
    ).offset(offset).limit(limit)

    return list(
        db.scalars(query).all()
    )


@router.get(
    "/count",
)
def get_audit_log_count(
    action: str | None = None,
    resource: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN.value)
    ),
):
    query = select(
        func.count(AuditLog.id)
    )

    if action:
        query = query.where(
            AuditLog.action == action
        )

    if resource:
        query = query.where(
            AuditLog.resource == resource
        )

    total = db.scalar(query) or 0

    return {
        "total": total
    }