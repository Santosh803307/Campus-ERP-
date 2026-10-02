from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from app.core.config import settings
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone


from app.core.database import get_db
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.dependencies import require_roles
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_service import create_audit_log
from app.core.rate_limit import check_rate_limit
from app.models.refresh_token import RefreshToken


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

@router.post(
    "/token",
)
async def login_for_swagger(
    http_request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    normalized_email = form_data.username.strip().lower()

    client_ip = (
        http_request.client.host
        if http_request.client
        else "unknown"
    )

    await check_rate_limit(
        key=f"token:email:{normalized_email}",
        limit=5,
        window=60,
    )

    await check_rate_limit(
        key=f"token:ip:{client_ip}",
        limit=20,
        window=60,
    )

    user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if (
        not user
        or not verify_password(
            form_data.password,
            user.hashed_password,
        )
        or not user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "email": user.email,
    }

    access_token = create_access_token(
        token_data,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    normalized_email = request.email.strip().lower()

    existing_user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        full_name=request.full_name,
        email=request.email,
        hashed_password=hash_password(
            request.password
        ),
        role=request.role,
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


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    http_request: Request,
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    normalized_email = request.email.strip().lower()

    client_ip = (
        http_request.client.host
        if http_request.client
        else "unknown"
    )

    await check_rate_limit(
        key=f"login:email:{normalized_email}",
        limit=5,
        window=60,
    )

    await check_rate_limit(
        key=f"login:ip:{client_ip}",
        limit=20,
        window=60,
    )

    user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if (
        not user
        or not verify_password(
            request.password,
            user.hashed_password,
        )
        or not user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "email": user.email,
    }

    access_token = create_access_token(
        token_data,
    )
    create_audit_log(
        db=db,
        user_id=user.id,
        action="LOGIN",
        resource="auth",
        resource_id=user.id,
        description="User logged in successfully",
    )

    db.commit()

    raw_refresh_token = generate_refresh_token()

    refresh_token_hash = hash_refresh_token(
        raw_refresh_token
    )

    refresh_token_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_hash,
        expires_at=refresh_token_expires_at.replace(
            tzinfo=None
        ),
    )

    db.add(refresh_token_record)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
        "user": user,
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    raw_refresh_token = request.refresh_token.strip()

    token_hash = hash_refresh_token(raw_refresh_token)

    refresh_token_record = db.scalar(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .with_for_update()
    )

    if refresh_token_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.utcnow()

    if refresh_token_record.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    if refresh_token_record.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    user = db.scalar(
        select(User).where(User.id == refresh_token_record.user_id)
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    # Revoke old refresh token
    refresh_token_record.revoked = True
    refresh_token_record.revoked_at = now

    # Generate new refresh token
    new_raw_refresh_token = generate_refresh_token()
    new_token_hash = hash_refresh_token(new_raw_refresh_token)

    new_expires_at = now + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    new_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=new_expires_at,
    )

    db.add(new_refresh_token)

    # Generate new access token
    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "email": user.email,
    }

    new_access_token = create_access_token(token_data)

    db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_raw_refresh_token,
        "token_type": "bearer",
        "user": user,
    }

@router.post("/logout")
async def logout(
    request: LogoutRequest,
    db: Session = Depends(get_db),
):
    raw_refresh_token = request.refresh_token.strip()

    token_hash = hash_refresh_token(raw_refresh_token)

    refresh_token_record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
    )

    # Logout should be safe to call repeatedly.
    # Do not reveal whether a token exists.
    if refresh_token_record is None:
        return {
            "message": "Logged out successfully"
        }

    if not refresh_token_record.revoked:
        refresh_token_record.revoked = True
        refresh_token_record.revoked_at = datetime.utcnow()
        db.commit()

    return {
        "message": "Logged out successfully"
    }