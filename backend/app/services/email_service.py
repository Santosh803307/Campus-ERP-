from email.message import EmailMessage
import smtplib
from typing import Optional

from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
) -> bool:
    """
    Send an email using SMTP.

    Returns:
        True  -> email sent successfully
        False -> email failed
    """

    try:
        message = EmailMessage()

        message["From"] = (
            f"{settings.SMTP_FROM_NAME} "
            f"<{settings.SMTP_FROM_EMAIL}>"
        )

        message["To"] = to_email
        message["Subject"] = subject

        # Plain-text fallback
        message.set_content(body)

        # Optional HTML version
        if html_body:
            message.add_alternative(
                html_body,
                subtype="html",
            )

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=20,
        ) as server:

            server.ehlo()

            if settings.SMTP_USE_TLS:
                server.starttls()
                server.ehlo()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(message)

        return True

    except Exception as error:

        print(
            f"[EMAIL ERROR] "
            f"Could not send email to "
            f"{to_email}: {error}"
        )

        return False

def send_notification_email(
    to_email: str,
    title: str,
    message: str,
) -> bool:
    """
    Send a Campus ERP notification email.
    """

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport"
              content="width=device-width,
              initial-scale=1.0">

        <title>{title}</title>
    </head>

    <body
        style="
            margin:0;
            padding:0;
            background:#f1f5f9;
            font-family:Arial,Helvetica,sans-serif;
        "
    >

        <div
            style="
                max-width:600px;
                margin:40px auto;
                background:white;
                border-radius:16px;
                overflow:hidden;
                box-shadow:
                    0 10px 30px
                    rgba(0,0,0,0.08);
            "
        >

            <div
                style="
                    background:#0f172a;
                    padding:24px;
                    text-align:center;
                "
            >
                <h1
                    style="
                        margin:0;
                        color:white;
                        font-size:24px;
                    "
                >
                    Campus ERP
                </h1>

                <p
                    style="
                        margin:8px 0 0;
                        color:#94a3b8;
                        font-size:14px;
                    "
                >
                    College Management Portal
                </p>
            </div>

            <div style="padding:32px;">

                <h2
                    style="
                        margin-top:0;
                        color:#0f172a;
                        font-size:22px;
                    "
                >
                    {title}
                </h2>

                <p
                    style="
                        color:#475569;
                        font-size:15px;
                        line-height:1.7;
                    "
                >
                    {message}
                </p>

                <div
                    style="
                        margin-top:28px;
                        padding:16px;
                        background:#f8fafc;
                        border-radius:10px;
                        color:#64748b;
                        font-size:13px;
                    "
                >
                    This is an automated email from
                    Campus ERP. Please do not reply
                    to this email.
                </div>

            </div>

            <div
                style="
                    border-top:1px solid #e2e8f0;
                    padding:18px;
                    text-align:center;
                    color:#94a3b8;
                    font-size:12px;
                "
            >
                © Campus ERP
            </div>

        </div>

    </body>
    </html>
    """

    return send_email(
        to_email=to_email,
        subject=f"Campus ERP — {title}",
        body=message,
        html_body=html_body,
    )