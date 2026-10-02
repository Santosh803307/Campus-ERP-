from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class CreatePaymentOrderResponse(BaseModel):
    payment_id: int
    order_id: str
    amount: int
    currency: str
    razorpay_key_id: str


class VerifyPaymentRequest(BaseModel):
    payment_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: int
    student_fee_id: int
    razorpay_order_id: str
    razorpay_payment_id: str | None
    amount: Decimal
    currency: str
    status: str
    payment_method: str | None
    paid_at: datetime | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }