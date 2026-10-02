from app.models.user import User
from app.models.student import Student
from app.models.department import Department
from app.models.fee_structure import FeeStructure
from app.models.student_fee import StudentFee
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.faculty import Faculty
from app.models.refresh_token import RefreshToken
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.exam_result import ExamResult
from app.models.document import StudentDocument
from app.models.notice import CollegeNotice
from app.models.support import SupportTicket

from app.models.no_dues import (
    NoDuesRequest,
    NoDuesApproval,
)
from app.models.out_pass import (
    OutPass,
    OutPassScanLog,
    OutPassStatus,
)

from app.models.notification import (
    Notification,
    NotificationType,
)