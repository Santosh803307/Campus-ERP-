from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    user_id: int | None,
    action: str,
    resource: str,
    resource_id: str | int | None = None,
    description: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLog:

    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=(
            str(resource_id)
            if resource_id is not None
            else None
        ),
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(audit_log)

    return audit_log