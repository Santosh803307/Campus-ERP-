"use client";

import { useCallback, useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface PendingNoDues {
  request_id: number;
  approval_id: number;
  student_id: number | null;
  student_name: string | null;
  enrollment_no: string | null;
  department: string;
  status: string;
  reason: string | null;
  applied_at: string;
}

export default function LibraryDashboard() {
  // =========================================================
  // STATE
  // =========================================================

  const [pendingNoDues, setPendingNoDues] = useState<
    PendingNoDues[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD PENDING NO-DUES
  // =========================================================

  const loadPendingNoDues = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response = await api.get<PendingNoDues[]>(
        "/api/no-dues/pending/list"
      );

      setPendingNoDues(response.data);
    } catch (err: any) {
      console.error(
        "Failed to load pending No-Dues:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load pending No-Dues requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadPendingNoDues();
  }, [loadPendingNoDues]);

  // =========================================================
  // APPROVE NO-DUES
  // =========================================================

  async function approveNoDues(
    requestId: number
  ) {
    try {
      setProcessingId(requestId);

      setError("");

      setSuccess("");

      await api.patch(
        `/api/no-dues/${requestId}/approval`,
        {
          status: "approved",
          remarks:
            "Library dues cleared. No-Dues approved by Library.",
        }
      );

      setSuccess(
        `No-Dues #${requestId} approved successfully.`
      );

      await loadPendingNoDues();
    } catch (err: any) {
      console.error(
        "Failed to approve No-Dues:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to approve No-Dues request."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // REJECT NO-DUES
  // =========================================================

  async function rejectNoDues(
    requestId: number
  ) {
    const remarks = window.prompt(
      "Enter rejection reason:"
    );

    if (remarks === null) {
      return;
    }

    const trimmedRemarks = remarks.trim();

    if (!trimmedRemarks) {
      setError(
        "Rejection reason is required."
      );

      return;
    }

    try {
      setProcessingId(requestId);

      setError("");

      setSuccess("");

      await api.patch(
        `/api/no-dues/${requestId}/approval`,
        {
          status: "rejected",
          remarks: trimmedRemarks,
        }
      );

      setSuccess(
        `No-Dues #${requestId} rejected successfully.`
      );

      await loadPendingNoDues();
    } catch (err: any) {
      console.error(
        "Failed to reject No-Dues:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to reject No-Dues request."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <AuthGuard allowedRoles={["library"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="font-semibold text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Library Dashboard
              </h1>

              <p className="mt-2 text-slate-400">
                Manage library clearance and student
                No-Dues requests.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPendingNoDues}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">

              <div className="flex items-start gap-3">

                <span className="text-xl">
                  ✅
                </span>

                <div>
                  <p className="font-bold text-emerald-300">
                    Success
                  </p>

                  <p className="mt-1 text-sm text-emerald-200">
                    {success}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">

              <div className="flex items-start gap-3">

                <span className="text-xl">
                  ❌
                </span>

                <div>
                  <p className="font-bold text-red-300">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-sm text-red-200">
                    {error}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Pending No-Dues */}

            <div className="rounded-3xl border border-yellow-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Pending No-Dues
                  </p>

                  <p className="mt-2 text-4xl font-bold text-yellow-400">
                    {pendingNoDues.length}
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
                  📋
                </div>

              </div>

            </div>

            {/* Library Clearance */}

            <div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Library Clearance
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    Active
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  📚
                </div>

              </div>

            </div>

            {/* System Status */}

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    System Status
                  </p>

                  <p className="mt-2 text-lg font-bold text-emerald-400">
                    Operational
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
                  🟢
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              PENDING NO-DUES
          ================================================= */}

          <section>

            <div className="mb-5">

              <h2 className="text-2xl font-bold">
                Pending No-Dues Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review student library clearance
                requests and process them.
              </p>

            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading pending No-Dues requests...
                </p>

              </div>

            ) : pendingNoDues.length === 0 ? (

              /* =================================================
                 EMPTY
              ================================================= */

              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">

                <div className="text-5xl">
                  🎉
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No Pending Requests
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no student
                  No-Dues requests waiting for
                  library approval.
                </p>

              </div>

            ) : (

              /* =================================================
                 REQUEST CARDS
              ================================================= */

              <div className="grid gap-6 lg:grid-cols-2">

                {pendingNoDues.map((item) => {

                  const isProcessing =
                    processingId ===
                    item.request_id;

                  return (
                    <div
                      key={item.approval_id}
                      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
                    >

                      {/* Card Header */}

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-xs uppercase tracking-wider text-slate-500">
                            Library No-Dues
                          </p>

                          <h3 className="mt-1 text-2xl font-bold">
                            Request #{item.request_id}
                          </h3>

                        </div>

                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase text-yellow-400">
                          {item.status}
                        </span>

                      </div>

                      {/* Details */}

                      <div className="mt-6 space-y-3">

                        {/* Student */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Student
                          </p>

                          <p className="mt-1 font-semibold">
                            👤{" "}
                            {item.student_name ||
                              "Unknown Student"}
                          </p>

                        </div>

                        {/* Enrollment */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Enrollment Number
                          </p>

                          <p className="mt-1 font-semibold">
                            🎓{" "}
                            {item.enrollment_no ||
                              "Not available"}
                          </p>

                        </div>

                        {/* Department */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Student Department
                          </p>

                          <p className="mt-1 font-semibold uppercase">
                            🏫{" "}
                            {item.department}
                          </p>

                        </div>

                        {/* Reason */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Request Reason
                          </p>

                          <p className="mt-1 font-semibold">
                            {item.reason ||
                              "No reason provided."}
                          </p>

                        </div>

                        {/* Applied At */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Applied At
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatDate(
                              item.applied_at
                            )}
                          </p>

                        </div>

                      </div>

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            approveNoDues(
                              item.request_id
                            )
                          }
                          disabled={isProcessing}
                          className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            rejectNoDues(
                              item.request_id
                            )
                          }
                          disabled={isProcessing}
                          className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "✕ Reject"}
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </section>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">

            <h2 className="font-bold text-blue-300">
              📚 Library Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Review student library clearance requests,
              verify outstanding library dues and issued
              books, and approve or reject No-Dues requests.
            </p>

          </div>

        </div>
      </main>
    </AuthGuard>
  );
}