from pydantic import BaseModel, Field, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: str = Field(
        min_length=5,
        max_length=255,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: UserRole


class UserCreateResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(
    default=None,
    min_length=8,
    max_length=128,
)