import api from "@/lib/api";

export interface PaymentOrder {
  payment_id: number;
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
}

export async function createPaymentOrder(
  studentFeeId: number
) {
  const response = await api.post<PaymentOrder>(
    `/api/payments/create-order?student_fee_id=${studentFeeId}`
  );

  return response.data;
}

export async function verifyPayment(data: {
  payment_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const response = await api.post(
    "/api/payments/verify",
    data
  );

  return response.data;
}