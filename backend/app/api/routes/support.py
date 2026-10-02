from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.student import Student
from app.models.support import SupportTicket
from app.models.user import User
from app.schemas.support import (
    SupportTicketCreate,
    SupportTicketListResponse,
    SupportTicketResponse,
)

router = APIRouter(
    prefix="/api/support",
    tags=["Help & Support"],
)


# =========================================================
# STUDENT — CREATE SUPPORT TICKET
# =========================================================

@router.post(
    "/tickets",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_support_ticket(
    payload: SupportTicketCreate,
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    ticket = SupportTicket(
        student_id=student.id,
        department=payload.department.strip(),
        category=payload.category.strip().lower(),
        description=payload.description.strip(),
        status="open",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


# =========================================================
# STUDENT — GET MY SUPPORT TICKETS
# =========================================================

@router.get(
    "/my-tickets",
    response_model=SupportTicketListResponse,
)
def get_my_support_tickets(
    current_user: User = Depends(
        require_roles("student")
    ),
    db: Session = Depends(get_db),
):
    student = db.scalar(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    tickets = db.scalars(
        select(SupportTicket)
        .where(
            SupportTicket.student_id == student.id
        )
        .order_by(
            SupportTicket.created_at.desc()
        )
    ).all()

    return {
        "data": tickets,
        "total": len(tickets),
    }