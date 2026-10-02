from pydantic import BaseModel


class StudentDashboardResponse(BaseModel):
    name: str
    email: str
    role: str
    enrollment_no: str | None
    department: str | None
    course: str | None
    semester: int | None

    pending_fees: float
    no_dues_status: str
    hostel_status: str


class FacultyDashboardResponse(BaseModel):
    name: str
    email: str
    role: str

    total_students: int
    pending_tasks: int


class AdminDashboardResponse(BaseModel):
    name: str
    email: str
    role: str

    total_users: int
    total_students: int
    total_faculty: int
    pending_requests: int