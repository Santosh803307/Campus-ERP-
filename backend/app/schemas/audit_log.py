from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    resource: str
    resource_id: str | None
    description: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )