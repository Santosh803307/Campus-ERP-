from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.models.no_dues import NoDuesApproval


def generate_no_dues_certificate(
    request,
    student,
    user,
    department,
    approvals,
):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="No-Dues Certificate",
        author="Campus ERP",
    )

    styles = getSampleStyleSheet()

    college_style = ParagraphStyle(
        "College",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#475569"),
    )

    certificate_style = ParagraphStyle(
        "Certificate",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1d4ed8"),
        spaceBefore=15,
        spaceAfter=10,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=16,
        textColor=colors.HexColor("#334155"),
    )

    center_style = ParagraphStyle(
        "Center",
        parent=body_style,
        alignment=TA_CENTER,
    )

    story = []

    # -------------------------------------------------
    # HEADER
    # -------------------------------------------------

    story.append(
        Paragraph(
            "CAMPUS ERP",
            college_style,
        )
    )

    story.append(
        Paragraph(
            "College Administration & Student Services",
            subtitle_style,
        )
    )

    story.append(
        Paragraph(
            "DIGITAL NO-DUES CERTIFICATE",
            certificate_style,
        )
    )

    # -------------------------------------------------
    # CERTIFICATE INTRO
    # -------------------------------------------------

    completion_date = (
        request.completed_at.strftime("%d %B %Y")
        if request.completed_at
        else datetime.utcnow().strftime("%d %B %Y")
    )

    story.append(
        Paragraph(
            f"""
            This is to certify that <b>{user.full_name}</b>,
            bearing enrollment number
            <b>{student.enrollment_no}</b>, has completed
            the No-Dues clearance process through Campus ERP.
            All required departmental clearances have been
            successfully completed.
            """,
            body_style,
        )
    )

    story.append(Spacer(1, 8 * mm))

    # -------------------------------------------------
    # STUDENT DETAILS
    # -------------------------------------------------

    student_data = [
        ["Student Name", user.full_name],
        ["Enrollment No.", student.enrollment_no],
        ["Course", student.course],
        ["Semester", str(student.semester)],
        ["Department", department.name],
        ["Certificate ID", f"NDC-{datetime.utcnow().year}-{request.id:06d}"],
        ["Application Date", request.applied_at.strftime("%d %B %Y")],
        ["Completion Date", completion_date],
    ]

    student_table = Table(
        student_data,
        colWidths=[48 * mm, 122 * mm],
    )

    student_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#eff6ff"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#1e3a8a"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold",
                ),
                (
                    "FONTNAME",
                    (1, 0),
                    (1, -1),
                    "Helvetica",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(student_table)

    story.append(Spacer(1, 9 * mm))

    # -------------------------------------------------
    # CLEARANCE DETAILS
    # -------------------------------------------------

    story.append(
        Paragraph(
            "Departmental Clearance",
            ParagraphStyle(
                "Section",
                parent=styles["Heading2"],
                fontName="Helvetica-Bold",
                fontSize=12,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=5,
            ),
        )
    )

    clearance_data = [
        ["Department", "Status", "Approved Date"]
    ]

    for approval in approvals:
        approved_date = (
            approval.approved_at.strftime("%d %b %Y")
            if approval.approved_at
            else "—"
        )

        clearance_data.append(
            [
                approval.department.value.title(),
                approval.status.value.upper(),
                approved_date,
            ]
        )

    clearance_table = Table(
        clearance_data,
        colWidths=[75 * mm, 45 * mm, 50 * mm],
    )

    clearance_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#1d4ed8"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTNAME",
                    (0, 1),
                    (-1, -1),
                    "Helvetica",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (-1, -1),
                    "CENTER",
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "BACKGROUND",
                    (0, 1),
                    (-1, -1),
                    colors.HexColor("#f8fafc"),
                ),
                (
                    "TEXTCOLOR",
                    (1, 1),
                    (1, -1),
                    colors.HexColor("#15803d"),
                ),
                (
                    "FONTNAME",
                    (1, 1),
                    (1, -1),
                    "Helvetica-Bold",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(clearance_table)

    story.append(Spacer(1, 10 * mm))

    # -------------------------------------------------
    # FINAL STATEMENT
    # -------------------------------------------------

    story.append(
        Paragraph(
            """
            This certificate is digitally generated by the
            Campus ERP system and confirms that the student has
            no pending dues with the departments listed above
            as of the completion date.
            """,
            body_style,
        )
    )

    story.append(Spacer(1, 15 * mm))

    # -------------------------------------------------
    # SIGNATURE AREA
    # -------------------------------------------------

    signature_data = [
        [
            Paragraph(
                "<b>Generated By</b><br/>Campus ERP System",
                center_style,
            ),
            Paragraph(
                "<b>Authorized Authority</b><br/>College Administration",
                center_style,
            ),
        ]
    ]

    signature_table = Table(
        signature_data,
        colWidths=[85 * mm, 85 * mm],
    )

    signature_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "BOTTOM",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
            ]
        )
    )

    story.append(signature_table)

    story.append(Spacer(1, 10 * mm))

    story.append(
        Paragraph(
            "This document is valid only after successful completion of all required No-Dues approvals.",
            ParagraphStyle(
                "Footer",
                parent=body_style,
                fontSize=8,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#64748b"),
            ),
        )
    )

    doc.build(story)

    buffer.seek(0)

    return buffer