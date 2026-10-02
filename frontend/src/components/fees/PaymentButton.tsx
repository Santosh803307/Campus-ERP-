"use client";

import { useState } from "react";
import {
  createPaymentOrder,
  verifyPayment,
} from "@/services/paymentService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentButtonProps {
  studentFeeId: number;
  amount: string;
}

export default function PaymentButton({
  studentFeeId,
  amount,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Create Razorpay order from backend
      const order = await createPaymentOrder(
        studentFeeId
      );

      // 2. Check Razorpay SDK
      if (!window.Razorpay) {
        alert(
          "Razorpay SDK is not loaded. Please refresh the page."
        );
        return;
      }

      // 3. Razorpay Checkout configuration
      const options = {
        key: order.razorpay_key_id,

        amount: order.amount,

        currency: order.currency,

        name: "Campus ERP",

        description: "College Fee Payment",

        order_id: order.order_id,

        handler: async function (response: any) {
          try {
            // 4. Verify payment with backend
            await verifyPayment({
              payment_id: order.payment_id,

              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_signature:
                response.razorpay_signature,
            });

            alert(
              "Payment successful! 🎉"
            );

            // Refresh page
            window.location.reload();

          } catch (error) {
            console.error(
              "Payment verification failed:",
              error
            );

            alert(
              "Payment verification failed."
            );
          }
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Payment window closed."
            );
          },
        },

        theme: {
          color: "#2563eb",
        },
      };

      // 5. Open Razorpay Checkout
      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Payment failed:",
            response.error
          );

          alert(
            response.error?.description ||
              "Payment failed."
          );
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        "Unable to create payment order:",
        error
      );

      alert(
        "Unable to start payment. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Processing..."
        : `Pay ₹${amount}`}
    </button>
  );
}