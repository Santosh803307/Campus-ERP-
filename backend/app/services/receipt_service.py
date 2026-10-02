from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_receipt_pdf(
    student_name: str,
    email: str,
    payment_id: str,
    order_id: str,
    amount: str,
    paid_at: str,
):
    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    width, height = A4

    pdf.setFont(
        "Helvetica-Bold",
        20,
    )

    pdf.drawCentredString(
        width / 2,
        height - 80,
        "CAMPUS ERP",
    )

    pdf.setFont(
        "Helvetica-Bold",
        15,
    )

    pdf.drawCentredString(
        width / 2,
        height - 110,
        "FEE PAYMENT RECEIPT",
    )

    pdf.setFont(
        "Helvetica",
        11,
    )

    y = height - 170

    details = [
        ("Student Name", student_name),
        ("Email", email),
        ("Payment ID", payment_id),
        ("Order ID", order_id),
        ("Amount", f"Rs. {amount}"),
        ("Payment Date", paid_at),
        ("Status", "PAID"),
    ]

    for label, value in details:
        pdf.setFont(
            "Helvetica-Bold",
            11,
        )

        pdf.drawString(
            80,
            y,
            f"{label}:",
        )

        pdf.setFont(
            "Helvetica",
            11,
        )

        pdf.drawString(
            200,
            y,
            str(value),
        )

        y -= 30

    pdf.line(
        80,
        y + 10,
        width - 80,
        y + 10,
    )

    pdf.setFont(
        "Helvetica-Bold",
        10,
    )

    pdf.drawCentredString(
        width / 2,
        80,
        "This is a digitally generated fee receipt.",
    )

    pdf.save()

    buffer.seek(0)

    return buffer