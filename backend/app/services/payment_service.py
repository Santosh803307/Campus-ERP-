import razorpay

from app.core.config import settings


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID:
        raise RuntimeError(
            "RAZORPAY_KEY_ID is not configured"
        )

    if not settings.RAZORPAY_KEY_SECRET:
        raise RuntimeError(
            "RAZORPAY_KEY_SECRET is not configured"
        )

    return razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )