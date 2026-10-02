from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.notice import CollegeNotice
from app.models.user import User
from app.schemas.notice import (
    CollegeNoticeCreate,
    CollegeNoticeListResponse,
    CollegeNoticeResponse,
    CollegeNoticeUpdate,
)

router = APIRouter(
    prefix="/api/notices",
    tags=["College Notices"],
)


# =========================================================
# STUDENT — GET NOTICES
# =========================================================

@router.get(
    "/me",
    response_model=CollegeNoticeListResponse,
)
def get_student_notices(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    notices = db.scalars(
        select(CollegeNotice)
        .order_by(
            CollegeNotice.published_at.desc()
        )
    ).all()

    return {
        "data": notices,
        "total": len(notices),
    }


# =========================================================
# ADMIN / FACULTY / HOD — GET ALL NOTICES
# =========================================================

@router.get(
    "/",
    response_model=CollegeNoticeListResponse,
)
def get_all_notices(
    current_user: User = Depends(
        require_roles(
            "admin",
            "faculty",
            "hod",
        )
    ),
    db: Session = Depends(get_db),
):
    notices = db.scalars(
        select(CollegeNotice)
        .order_by(
            CollegeNotice.published_at.desc()
        )
    ).all()

    return {
        "data": notices,
        "total": len(notices),
    }


# =========================================================
# ADMIN — CREATE NOTICE
# =========================================================

@router.post(
    "/",
    response_model=CollegeNoticeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_notice(
    payload: CollegeNoticeCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    notice = CollegeNotice(
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip().lower(),
        priority=payload.priority.strip().lower(),
        department=payload.department.strip(),
    )

    db.add(notice)

    try:
        db.commit()
        db.refresh(notice)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Notice could not be created",
        )

    return notice


# =========================================================
# ADMIN — UPDATE NOTICE
# =========================================================

@router.put(
    "/{notice_id}",
    response_model=CollegeNoticeResponse,
)
def update_notice(
    notice_id: int,
    payload: CollegeNoticeUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    notice = db.get(
        CollegeNotice,
        notice_id,
    )

    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

            if field in {
                "category",
                "priority",
            }:
                value = value.lower()

        setattr(
            notice,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(notice)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Notice could not be updated",
        )

    return notice


# =========================================================
# ADMIN — DELETE NOTICE
# =========================================================

@router.delete(
    "/{notice_id}",
)
def delete_notice(
    notice_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    notice = db.get(
        CollegeNotice,
        notice_id,
    )

    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    db.delete(notice)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Notice could not be deleted",
        )

    return {
        "message": "Notice deleted successfully",
    }