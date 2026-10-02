"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import Link from "next/link";

interface PaymentRecord {
  payment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  enrollment_no: string;
  student_fee_id: number;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
}

interface PaymentResponse {
  data: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  statistics: {
    total_transactions: number;
    successful_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    total_collected: number;
  };
}

export default function AdminFeesPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statistics, setStatistics] =
    useState<PaymentResponse["statistics"] | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  // ============================================================
  // LOAD PAYMENTS
  // ============================================================

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<PaymentResponse>(
        "/api/payments/admin/list",
        {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
            status_filter: status || undefined,
          },
        }
      );

      setPayments(response.data.data);
      setStatistics(response.data.statistics);
      setTotalPages(
        response.data.pagination.total_pages || 1
      );
    } catch (err: any) {
      console.error("Payment loading error:", err);

      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err?.response?.status === 403) {
        setError(
          "You do not have permission to view payments."
        );
      } else {
        setError(
          "Unable to load payment records."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL + FILTER/PAGINATION LOAD
  // ============================================================

  useEffect(() => {
    loadPayments();
  }, [page, status]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = () => {
    setPage(1);
    loadPayments();
  };

  // ============================================================
  // RECEIPT DOWNLOAD
  // ============================================================

  const downloadReceipt = async (
    paymentId: number
  ) => {
    try {
      const response = await api.get(
        `/api/payments/${paymentId}/receipt`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `fee_receipt_${paymentId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Receipt download error:",
        err
      );

      alert(
        "Unable to download receipt."
      );
    }
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getStatusStyle = (
    paymentStatus: string
  ) => {
    switch (paymentStatus.toUpperCase()) {
      case "SUCCESS":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";

      case "FAILED":
        return "bg-red-500/15 text-red-400 border-red-500/20";

      case "CREATED":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";

      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Fees & Payments
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                Manage fee structures, monitor student
                payments and access payment receipts.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPayments}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>

          {/* ================================================== */}
          {/* STATISTICS */}
          {/* ================================================== */}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Total */}
            <div className="rounded-2xl border border-blue-500/20 bg-slate-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Total Transactions
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {statistics?.total_transactions ?? 0}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-500/10 p-3 text-2xl">
                  💳
                </div>
              </div>
            </div>

            {/* Successful */}
            <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Successful
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-400">
                    {statistics?.successful_transactions ?? 0}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-500/10 p-3 text-2xl">
                  ✅
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Pending
                  </p>

                  <p className="mt-2 text-3xl font-bold text-yellow-400">
                    {statistics?.pending_transactions ?? 0}
                  </p>
                </div>

                <div className="rounded-xl bg-yellow-500/10 p-3 text-2xl">
                  ⏳
                </div>
              </div>
            </div>

            {/* Collected */}
            <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Total Collected
                  </p>

                  <p className="mt-2 text-2xl font-bold text-purple-400">
                    ₹
                    {(
                      statistics?.total_collected ?? 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-xl bg-purple-500/10 p-3 text-2xl">
                  💰
                </div>
              </div>
            </div>

          </div>

          {/* ================================================== */}
          {/* FEE STRUCTURES */}
          {/* ================================================== */}

          <div className="mt-8 rounded-2xl border border-blue-500/20 bg-slate-900 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-blue-500/10 p-3 text-2xl">
                    💰
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Fee Structures
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage semester and course fee structures.
                    </p>
                  </div>

                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-3">

                {/* ASSIGN FEE */}
                <Link
                  href="/dashboard/admin/fees/assign"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-500"
                >
                  + Assign Fee
                </Link>

                {/* MANAGE FEES */}
                <Link
                  href="/dashboard/admin/fees/structures"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
                >
                  Manage Fees →
                </Link>

              </div>

            </div>
          </div>

          {/* ================================================== */}
          {/* SEARCH + FILTER */}
          {/* ================================================== */}

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="flex flex-col gap-4 lg:flex-row">

              {/* Search */}
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Search Payments
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Student name, email, enrollment, order ID..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
                  >
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="w-full lg:w-56">
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Payment Status
                </label>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="SUCCESS">
                    Success
                  </option>

                  <option value="CREATED">
                    Pending
                  </option>

                  <option value="FAILED">
                    Failed
                  </option>
                </select>
              </div>

            </div>
          </div>

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
              <p className="font-semibold text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={loadPayments}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ================================================== */}
          {/* PAYMENT TABLE */}
          {/* ================================================== */}

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-xl font-bold">
                    Payment Records
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Live payment records from Campus ERP.
                  </p>
                </div>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400">
                  {payments.length} records
                </span>

              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading payment records...
                </p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl">
                  💳
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  No Payments Found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No payment records match your search
                  or filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">

                  <thead className="bg-slate-950/70">
                    <tr className="border-b border-slate-800">

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Enrollment
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Order ID
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.payment_id}
                        className="border-b border-slate-800/70 transition hover:bg-slate-800/40"
                      >

                        {/* Student */}
                        <td className="px-6 py-5">
                          <div className="font-semibold text-white">
                            {payment.student_name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {payment.student_email}
                          </div>
                        </td>

                        {/* Enrollment */}
                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            {payment.enrollment_no}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-5">
                          <span className="font-bold text-white">
                            ₹
                            {payment.amount.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getStatusStyle(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        {/* Order */}
                        <td className="px-6 py-5">
                          <span
                            className="block max-w-[180px] truncate text-xs text-slate-400"
                            title={
                              payment.razorpay_order_id
                            }
                          >
                            {payment.razorpay_order_id}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5 text-sm text-slate-400">
                          {formatDate(
                            payment.paid_at ||
                            payment.created_at
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-5">
                          {payment.status.toUpperCase() ===
                            "SUCCESS" ? (
                            <button
                              type="button"
                              onClick={() =>
                                downloadReceipt(
                                  payment.payment_id
                                )
                              }
                              className="whitespace-nowrap rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold transition hover:bg-purple-500"
                            >
                              🧾 Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">
                              No receipt
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* PAGINATION */}
          {/* ================================================== */}

          {!loading &&
            payments.length > 0 && (
              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-white">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {totalPages}
                  </span>
                </p>

                <div className="flex gap-2">

                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                      )
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>

                </div>
              </div>
            )}

          {/* ================================================== */}
          {/* INFO */}
          {/* ================================================== */}

          <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
            <h2 className="font-bold text-blue-300">
              💡 Payment System
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Razorpay payment processing, signature
              verification, webhook handling, notifications,
              audit logging and PDF receipts are integrated
              with the Campus ERP backend.
            </p>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}