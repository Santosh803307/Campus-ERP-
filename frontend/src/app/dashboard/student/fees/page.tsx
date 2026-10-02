"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import PaymentButton from "@/components/fees/PaymentButton";

interface StudentFee {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount: number | string;
  paid_amount: number | string;
  due_date?: string | null;
  status: string;
  created_at: string;
}

interface Payment {
  id: number;
  student_fee_id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  amount: number | string;
  currency: string;
  status: string;
  paid_at?: string | null;
}

export default function StudentFeesPage() {
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD FEES + PAYMENTS
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [feesResponse, paymentsResponse] =
        await Promise.all([
          api.get<StudentFee[]>("/api/fees/my-fees"),
          api.get<Payment[]>("/api/payments/my-payments"),
        ]);

      setFees(feesResponse.data);
      setPayments(paymentsResponse.data);
    } catch (err) {
      console.error("Failed to load fee data:", err);
      setError("Unable to load fee information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // DOWNLOAD RECEIPT
  // =========================================================

  const downloadReceipt = async (paymentId: number) => {
    try {
      const response = await api.get(
        `/api/payments/${paymentId}/receipt`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `fee_receipt_${paymentId}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Receipt download failed:", err);
      alert("Unable to download receipt. Please try again.");
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8">
        <h1 className="mb-6 text-3xl font-bold">
          My Fees
        </h1>

        <div className="rounded-xl border border-slate-700 p-6">
          Loading fee information...
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="p-8">
        <h1 className="mb-6 text-3xl font-bold">
          My Fees
        </h1>

        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-400">
          {error}

          <button
            onClick={loadData}
            className="mt-4 block rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        My Fees
      </h1>

      {/* =====================================================
          NO FEES
      ====================================================== */}

      {fees.length === 0 && (
        <div className="rounded-xl border border-slate-700 p-6">
          No fees assigned yet.
        </div>
      )}

      {/* =====================================================
          FEES
      ====================================================== */}

      <div className="space-y-6">
        {fees.map((fee) => {
          const amount = Number(fee.amount);
          const paidAmount = Number(fee.paid_amount);

          const relatedPayments = payments.filter(
            (payment) =>
              payment.student_fee_id === fee.id &&
              payment.status.toUpperCase() === "SUCCESS"
          );

          const latestPayment =
            relatedPayments.length > 0
              ? relatedPayments[0]
              : null;

          const isPaid =
            fee.status.toUpperCase() === "PAID";

          return (
            <div
              key={fee.id}
              className="rounded-xl border border-slate-700 p-6"
            >
              <h2 className="text-xl font-semibold">
                Tuition Fee
              </h2>

              <p className="mt-2 text-slate-400">
                Amount: ₹{amount.toLocaleString("en-IN")}
              </p>

              <p className="mt-2">
                Paid: ₹
                {paidAmount.toLocaleString("en-IN")}
              </p>

              <p className="mt-2">
                Status:{" "}
                <span
                  className={
                    isPaid
                      ? "font-semibold text-green-400"
                      : "font-semibold text-yellow-400"
                  }
                >
                  {fee.status}
                </span>
              </p>

              {/* =================================================
                  PENDING / PARTIAL
              ================================================== */}

              {!isPaid && (
                <div className="mt-5">
                  <PaymentButton
                    studentFeeId={fee.id}
                    amount={String(amount - paidAmount)}
                  />
                </div>
              )}

              {/* =================================================
                  PAID
              ================================================== */}

              {isPaid && (
                <div className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <p className="font-semibold text-green-400">
                    ✓ Payment Successful
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    ₹
                    {paidAmount.toLocaleString("en-IN")} paid
                    successfully.
                  </p>

                  {latestPayment && (
                    <>
                      <div className="mt-4 space-y-1 text-sm text-slate-300">
                        <p>
                          Payment ID:{" "}
                          {latestPayment.razorpay_payment_id ||
                            "N/A"}
                        </p>

                        <p>
                          Order ID:{" "}
                          {latestPayment.razorpay_order_id}
                        </p>

                        <p>
                          Date:{" "}
                          {latestPayment.paid_at
                            ? new Date(
                                latestPayment.paid_at
                              ).toLocaleString("en-IN")
                            : "N/A"}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          downloadReceipt(
                            latestPayment.id
                          )
                        }
                        className="mt-4 rounded-lg bg-green-600 px-5 py-2 font-semibold text-white transition hover:bg-green-700"
                      >
                        Download Receipt
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =====================================================
          PAYMENT HISTORY
      ====================================================== */}

      {payments.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">
            Payment History
          </h2>

          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl border border-slate-700 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <p className="font-semibold">
                      Payment #{payment.id}
                    </p>

                    <p className="mt-1 text-slate-400">
                      Amount: ₹
                      {Number(payment.amount).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    <p className="mt-1 text-slate-400">
                      Status:{" "}
                      <span className="font-semibold text-green-400">
                        {payment.status}
                      </span>
                    </p>

                    {payment.razorpay_payment_id && (
                      <p className="mt-1 text-sm text-slate-500">
                        Razorpay ID:{" "}
                        {payment.razorpay_payment_id}
                      </p>
                    )}
                  </div>

                  {payment.status.toUpperCase() ===
                    "SUCCESS" && (
                    <button
                      onClick={() =>
                        downloadReceipt(payment.id)
                      }
                      className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                      Download Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}