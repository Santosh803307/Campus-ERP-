from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.schemas.user import (
    UserCreate,
    UserCreateResponse,
    UserUpdate,
)
from app.models.user import User
from app.schemas.auth import UserResponse
from app.core.security import hash_password

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# Get active users
@router.get(
    "/",
    response_model=list[UserResponse],
)
def get_users(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(User)
        .where(
            User.is_active.is_(True)
        )
        .order_by(User.id.desc())
    ).all()

    return users


# Get logged-in user's profile
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user

# Get single user
@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user

# Admin-only test endpoint
@router.get(
    "/admin-only",
)
def admin_only(
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    return {
        "message": "Welcome Admin",
        "user": current_user.full_name,
        "role": current_user.role.value,
    }

@router.post(
    "/",
    response_model=UserCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    existing_user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=data.email.strip().lower(),
        hashed_password=hash_password(
            data.password
        ),
        role=data.role,
        is_active=True,
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    db.refresh(user)

    return user

# Update user
@router.patch(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Email change
    if data.email is not None:
        email = str(data.email).strip().lower()

        existing_user = db.scalar(
            select(User).where(
                User.email == email,
                User.id != user_id,
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        user.email = email

    # Name
    if data.full_name is not None:
        full_name = data.full_name.strip()

        if not full_name:
            raise HTTPException(
                status_code=400,
                detail="Full name cannot be empty",
            )

        user.full_name = full_name

    # Role
    if data.role is not None:
        user.role = data.role

    # Active / inactive
    if data.is_active is not None:
        user.is_active = data.is_active

    # Password
    if data.password:
        user.hashed_password = hash_password(
            data.password
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update user due to a data conflict",
        )

    db.refresh(user)

    return user