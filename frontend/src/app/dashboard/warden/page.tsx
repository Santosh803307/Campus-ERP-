"use client";

import { useCallback, useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

import type { OutPass } from "@/services/outPassService";

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

export default function WardenDashboard() {
  // =========================================================
  // OUT-PASS STATE
  // =========================================================

  const [pendingPasses, setPendingPasses] = useState<OutPass[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] = useState<number | null>(
    null
  );

  // =========================================================
  // NO-DUES STATE
  // =========================================================

  const [pendingNoDues, setPendingNoDues] = useState<
    PendingNoDues[]
  >([]);

  const [noDuesLoading, setNoDuesLoading] = useState(true);

  const [processingNoDuesId, setProcessingNoDuesId] =
    useState<number | null>(null);

  // =========================================================
  // COMMON STATE
  // =========================================================

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD PENDING OUT-PASSES
  // =========================================================

  const loadPendingPasses = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get<OutPass[]>(
        "/api/out-pass/pending/list"
      );

      setPendingPasses(response.data);
    } catch (err: any) {
      console.error(
        "Failed to load pending Out-Passes:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load pending Out-Passes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD PENDING NO-DUES
  // =========================================================

  const loadPendingNoDues = useCallback(async () => {
    try {
      setNoDuesLoading(true);

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
      setNoDuesLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD ALL PAGE DATA
  // =========================================================

  const loadDashboard = useCallback(async () => {
    setError("");

    await Promise.all([
      loadPendingPasses(),
      loadPendingNoDues(),
    ]);
  }, [
    loadPendingPasses,
    loadPendingNoDues,
  ]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =========================================================
  // APPROVE OUT-PASS
  // =========================================================

  async function approveOutPass(outPassId: number) {
    try {
      setProcessingId(outPassId);

      setError("");

      setSuccess("");

      await api.patch(
        `/api/out-pass/${outPassId}/approval`,
        {
          status: "approved",
          remarks:
            "Out-Pass approved by Warden.",
        }
      );

      setSuccess(
        `Out-Pass #${outPassId} approved successfully.`
      );

      await loadPendingPasses();
    } catch (err: any) {
      console.error(
        "Failed to approve Out-Pass:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to approve Out-Pass."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // REJECT OUT-PASS
  // =========================================================

  async function rejectOutPass(outPassId: number) {
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
      setProcessingId(outPassId);

      setError("");

      setSuccess("");

      await api.patch(
        `/api/out-pass/${outPassId}/approval`,
        {
          status: "rejected",
          remarks: trimmedRemarks,
        }
      );

      setSuccess(
        `Out-Pass #${outPassId} rejected.`
      );

      await loadPendingPasses();
    } catch (err: any) {
      console.error(
        "Failed to reject Out-Pass:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to reject Out-Pass."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // APPROVE NO-DUES
  // =========================================================

  async function approveNoDues(
    requestId: number
  ) {
    try {
      setProcessingNoDuesId(requestId);

      setError("");

      setSuccess("");

      await api.patch(
        `/api/no-dues/${requestId}/approval`,
        {
          status: "approved",
          remarks:
            "No-Dues approved by Warden.",
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
          "Failed to approve No-Dues."
      );
    } finally {
      setProcessingNoDuesId(null);
    }
  }

  // =========================================================
  // REJECT NO-DUES
  // =========================================================

  async function rejectNoDues(
    requestId: number
  ) {
    const remarks = window.prompt(
      "Enter No-Dues rejection reason:"
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
      setProcessingNoDuesId(requestId);

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
          "Failed to reject No-Dues."
      );
    } finally {
      setProcessingNoDuesId(null);
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
    <AuthGuard allowedRoles={["warden"]}>
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
                Warden Dashboard
              </h1>

              <p className="mt-2 text-slate-400">
                Manage hostel services, student Out-Pass
                and No-Dues requests.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={
                loading || noDuesLoading
              }
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading || noDuesLoading
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
              DASHBOARD SUMMARY
          ================================================= */}

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Pending Out-Passes */}

            <div className="rounded-3xl border border-yellow-500/20 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Pending Out-Passes
                  </p>

                  <p className="mt-2 text-4xl font-bold text-yellow-400">
                    {pendingPasses.length}
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
                  🪪
                </div>
              </div>
            </div>

            {/* Pending No-Dues */}

            <div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Pending No-Dues
                  </p>

                  <p className="mt-2 text-4xl font-bold text-blue-400">
                    {pendingNoDues.length}
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  📋
                </div>
              </div>
            </div>

            {/* Hostel */}

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Hostel Management
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    Active
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
                  🏠
                </div>
              </div>
            </div>

            {/* Security */}

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Security Monitoring
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    Active
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
                  🔐
                </div>
              </div>
            </div>

          </div>

          {/* =================================================
              PENDING OUT-PASSES
          ================================================= */}

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Pending Out-Passes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review and process student Out-Pass
                  applications.
                </p>
              </div>
            </div>

            {/* Loading */}

            {loading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading pending Out-Passes...
                </p>
              </div>
            ) : pendingPasses.length === 0 ? (

              /* Empty */

              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
                <div className="text-5xl">
                  🎉
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No Pending Requests
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no Out-Passes
                  waiting for approval.
                </p>
              </div>

            ) : (

              /* Requests */

              <div className="grid gap-6 lg:grid-cols-2">

                {pendingPasses.map((pass) => {
                  const isProcessing =
                    processingId === pass.id;

                  return (
                    <div
                      key={pass.id}
                      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
                    >

                      {/* Card Header */}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-500">
                            Hostel Out-Pass
                          </p>

                          <h3 className="mt-1 text-2xl font-bold">
                            #{pass.id}
                          </h3>
                        </div>

                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase text-yellow-400">
                          {pass.status}
                        </span>
                      </div>

                      {/* Details */}

                      <div className="mt-6 space-y-3">

                        {/* Reason */}

                        <div className="rounded-2xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-500">
                            Reason
                          </p>

                          <p className="mt-1 font-semibold">
                            {pass.reason}
                          </p>
                        </div>

                        {/* Destination */}

                        <div className="rounded-2xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-500">
                            Destination
                          </p>

                          <p className="mt-1 font-semibold">
                            📍 {pass.destination}
                          </p>
                        </div>

                        {/* Emergency Contact */}

                        <div className="rounded-2xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-500">
                            Emergency Contact
                          </p>

                          <p className="mt-1 font-semibold">
                            📞 {pass.emergency_contact}
                          </p>
                        </div>

                        {/* Time */}

                        <div className="grid gap-3 sm:grid-cols-2">

                          <div className="rounded-2xl bg-slate-950 p-4">
                            <p className="text-xs text-slate-500">
                              Departure
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatDate(
                                pass.departure_time
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-950 p-4">
                            <p className="text-xs text-slate-500">
                              Expected Return
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatDate(
                                pass.expected_return_time
                              )}
                            </p>
                          </div>

                        </div>

                      </div>

                      {/* Actions */}

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            approveOutPass(
                              pass.id
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
                            rejectOutPass(
                              pass.id
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
              PENDING NO-DUES
          ================================================= */}

          <section className="mt-12">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Pending No-Dues
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review hostel-related No-Dues
                  applications from students.
                </p>
              </div>
            </div>

            {/* Loading */}

            {noDuesLoading ? (

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading pending No-Dues requests...
                </p>

              </div>

            ) : pendingNoDues.length === 0 ? (

              /* Empty */

              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">

                <div className="text-5xl">
                  🎉
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No Pending No-Dues
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no No-Dues
                  requests waiting for hostel approval.
                </p>

              </div>

            ) : (

              /* Requests */

              <div className="grid gap-6 lg:grid-cols-2">

                {pendingNoDues.map((item) => {

                  const isProcessing =
                    processingNoDuesId ===
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
                            No-Dues Request
                          </p>

                          <h3 className="mt-1 text-2xl font-bold">
                            #{item.request_id}
                          </h3>

                        </div>

                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase text-blue-400">
                          {item.status}
                        </span>

                      </div>

                      {/* Student Details */}

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
                            Department
                          </p>

                          <p className="mt-1 font-semibold uppercase">
                            🏫{" "}
                            {item.department}
                          </p>

                        </div>

                        {/* Reason */}

                        <div className="rounded-2xl bg-slate-950 p-4">

                          <p className="text-xs text-slate-500">
                            Reason
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

                      {/* Actions */}

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
              🏠 Warden Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Review student Out-Pass applications,
              approve valid hostel requests, and process
              hostel No-Dues approvals. Approved No-Dues
              requests will continue through the remaining
              clearance workflow.
            </p>

          </div>

        </div>
      </main>
    </AuthGuard>
  );
}