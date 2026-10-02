import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.departments import router as departments_router
from app.api.routes.fees import router as fees_router
from app.api.routes.payments import router as payments_router
from app.api.routes.students import router as students_router
from app.api.routes.no_dues import router as no_dues_router
from app.api.routes.out_pass import router as out_pass_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.audit_logs import (
    router as audit_logs_router,
)
from app.api.routes.analytics import router as analytics_router
from app.api.routes.search import router as search_router
from app.api.routes.faculty import router as faculty_router
from app.api.routes.attendance import router as attendance_router
from app.api.routes.exams import router as exams_router
from app.api.routes.exam_results import router as exam_results_router
from app.api.routes import documents
from app.api.routes import notices
from app.api.routes import support

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Campus ERP Portal - Administration & Operational Services",
)

# =========================================================
# Global Exception Handler
# =========================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
        },
    )

# =========================================================
# Security Headers Middleware
# =========================================================

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )

    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
    ],
)

# API Routes
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(departments_router)
app.include_router(fees_router)
app.include_router(payments_router)
app.include_router(students_router)
app.include_router(no_dues_router)
app.include_router(out_pass_router)
app.include_router(notifications_router)
app.include_router(audit_logs_router)
app.include_router(analytics_router)
app.include_router(search_router)
app.include_router(faculty_router)
app.include_router(attendance_router)
app.include_router(exams_router)
app.include_router(exam_results_router)
app.include_router(
    documents.router
)
app.include_router(
    notices.router
)
app.include_router(
    support.router
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Campus ERP API",
        "status": "online",
    }