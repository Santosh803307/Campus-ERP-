"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface NoDuesApproval {
  id: number;
  no_dues_request_id: number;
  department: string;
  status: string;
  remarks: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
}

interface NoDuesRequest {
  id: number;
  student_id: number;
  status: string;
  reason: string | null;
  applied_at: string;
  completed_at: string | null;
}

interface NoDuesRecord {
  request: NoDuesRequest;
  approvals: NoDuesApproval[];
}

export default function AdminNoDuesPage() {
  // =========================================================
  // STATE
  // =========================================================

  const [records, setRecords] = useState<NoDuesRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState<NoDuesRecord | null>(null);

  const [statusFilter, setStatusFilter] =
    useState("all");

  // =========================================================
  // LOAD ALL NO-DUES REQUESTS
  // =========================================================

  const loadNoDuesRequests = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<NoDuesRecord[]>(
            "/api/no-dues/"
          );

        setRecords(response.data);
      } catch (err: any) {
        console.error(
          "Failed to load No-Dues requests:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load No-Dues requests."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadNoDuesRequests();
  }, [loadNoDuesRequests]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredRecords = useMemo(() => {
    if (statusFilter === "all") {
      return records;
    }

    return records.filter(
      (record) =>
        record.request.status.toLowerCase() ===
        statusFilter.toLowerCase()
    );
  }, [records, statusFilter]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalRequests = records.length;

  const completedRequests = records.filter(
    (record) =>
      record.request.status === "completed"
  ).length;

  const inProgressRequests = records.filter(
    (record) =>
      record.request.status === "in_progress" ||
      record.request.status === "pending"
  ).length;

  const rejectedRequests = records.filter(
    (record) =>
      record.request.status === "rejected"
  ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  // =========================================================
  // STATUS STYLE
  // =========================================================

  function getStatusClass(
    status: string
  ) {
    switch (status.toLowerCase()) {
      case "completed":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

      case "approved":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

      case "rejected":
        return "border-red-500/30 bg-red-500/10 text-red-300";

      case "in_progress":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

      case "pending":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  }

  // =========================================================
  // STATUS LABEL
  // =========================================================

  function getStatusLabel(
    status: string
  ) {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  // =========================================================
  // DEPARTMENT LABEL
  // =========================================================

  function getDepartmentLabel(
    department: string
  ) {
    return department
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  // =========================================================
  // APPROVED COUNT
  // =========================================================

  function getApprovedCount(
    approvals: NoDuesApproval[]
  ) {
    return approvals.filter(
      (approval) =>
        approval.status === "approved"
    ).length;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <AuthGuard allowedRoles={["admin"]}>
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
                No-Dues Management
              </h1>

              <p className="mt-2 text-slate-400">
                Monitor student No-Dues applications,
                department approvals and completion status.
              </p>

            </div>

            <button
              type="button"
              onClick={loadNoDuesRequests}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

          {/* =================================================
              ERROR
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

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Total */}

            <div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Total Requests
                  </p>

                  <p className="mt-2 text-4xl font-bold text-blue-400">
                    {totalRequests}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  📋
                </div>

              </div>

            </div>

            {/* In Progress */}

            <div className="rounded-3xl border border-yellow-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    In Progress
                  </p>

                  <p className="mt-2 text-4xl font-bold text-yellow-400">
                    {inProgressRequests}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
                  ⏳
                </div>

              </div>

            </div>

            {/* Completed */}

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Completed
                  </p>

                  <p className="mt-2 text-4xl font-bold text-emerald-400">
                    {completedRequests}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
                  ✅
                </div>

              </div>

            </div>

            {/* Rejected */}

            <div className="rounded-3xl border border-red-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Rejected
                  </p>

                  <p className="mt-2 text-4xl font-bold text-red-400">
                    {rejectedRequests}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
                  ❌
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  🔎 Filter Requests
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Filter No-Dues applications by status.
                </p>

              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >

                <option value="all">
                  All Requests
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="pending">
                  Pending
                </option>

              </select>

            </div>

          </section>

          {/* =================================================
              REQUEST LIST
          ================================================= */}

          <section className="rounded-3xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 p-6">

              <h2 className="text-xl font-bold">
                No-Dues Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All student No-Dues applications.
              </p>

            </div>

            {/* Loading */}

            {loading ? (

              <div className="p-12 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading No-Dues requests...
                </p>

              </div>

            ) : filteredRecords.length === 0 ? (

              <div className="p-12 text-center">

                <div className="text-5xl">
                  📭
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No No-Dues Requests
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No requests match the selected filter.
                </p>

              </div>

            ) : (

              <div className="grid gap-6 p-6">

                {filteredRecords.map(
                  (record) => {

                    const request =
                      record.request;

                    const approvals =
                      record.approvals;

                    const approvedCount =
                      getApprovedCount(
                        approvals
                      );

                    const totalDepartments =
                      approvals.length;

                    return (
                      <div
                        key={request.id}
                        className="rounded-3xl border border-slate-800 bg-slate-950 p-6 transition hover:border-slate-700"
                      >

                        {/* Card Header */}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              No-Dues Request
                            </p>

                            <h3 className="mt-1 text-2xl font-bold">
                              #{request.id}
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                              Student ID:{" "}
                              {request.student_id}
                            </p>

                          </div>

                          <span
                            className={`w-fit rounded-full border px-4 py-2 text-xs font-bold uppercase ${getStatusClass(
                              request.status
                            )}`}
                          >
                            {getStatusLabel(
                              request.status
                            )}
                          </span>

                        </div>

                        {/* Details */}

                        <div className="mt-6 grid gap-4 md:grid-cols-3">

                          <div className="rounded-2xl bg-slate-900 p-4">

                            <p className="text-xs text-slate-500">
                              Applied At
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatDate(
                                request.applied_at
                              )}
                            </p>

                          </div>

                          <div className="rounded-2xl bg-slate-900 p-4">

                            <p className="text-xs text-slate-500">
                              Completed At
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatDate(
                                request.completed_at
                              )}
                            </p>

                          </div>

                          <div className="rounded-2xl bg-slate-900 p-4">

                            <p className="text-xs text-slate-500">
                              Department Clearance
                            </p>

                            <p className="mt-1 text-lg font-bold text-blue-400">
                              {approvedCount}/
                              {totalDepartments}
                            </p>

                          </div>

                        </div>

                        {/* Reason */}

                        <div className="mt-4 rounded-2xl bg-slate-900 p-4">

                          <p className="text-xs text-slate-500">
                            Reason
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {request.reason ||
                              "No reason provided."}
                          </p>

                        </div>

                        {/* Approval Progress */}

                        <div className="mt-6">

                          <div className="mb-3 flex items-center justify-between">

                            <p className="text-sm font-semibold">
                              Department Approvals
                            </p>

                            <p className="text-sm text-slate-500">
                              {approvedCount}/
                              {totalDepartments}
                            </p>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{
                                width:
                                  totalDepartments >
                                  0
                                    ? `${
                                        (approvedCount /
                                          totalDepartments) *
                                        100
                                      }%`
                                    : "0%",
                              }}
                            />

                          </div>

                        </div>

                        {/* Departments */}

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                          {approvals.map(
                            (approval) => (
                              <div
                                key={
                                  approval.id
                                }
                                className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                              >

                                <p className="text-xs text-slate-500">
                                  {getDepartmentLabel(
                                    approval.department
                                  )}
                                </p>

                                <span
                                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                    approval.status
                                  )}`}
                                >
                                  {getStatusLabel(
                                    approval.status
                                  )}
                                </span>

                                {approval.remarks && (
                                  <p className="mt-2 text-xs leading-5 text-slate-500">
                                    {approval.remarks}
                                  </p>
                                )}

                              </div>
                            )
                          )}

                        </div>

                        {/* Actions */}

                        <div className="mt-6 flex flex-wrap gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRecord(
                                record
                              )
                            }
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500"
                          >
                            👁 View Details
                          </button>

                          {request.status ===
                            "completed" && (
                            <a
                              href={`/api/no-dues/${request.id}/certificate`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold transition hover:bg-emerald-500"
                            >
                              📄 Certificate
                            </a>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">

            <h2 className="font-bold text-blue-300">
              📋 Admin No-Dues Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Administrators can monitor all student
              No-Dues applications, track department
              approvals and access completed certificates.
              Department approvals are processed by their
              respective staff dashboards.
            </p>

          </div>

        </div>

        {/* =================================================
            DETAILS MODAL
        ================================================= */}

        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              {/* Modal Header */}

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm text-blue-400">
                    No-Dues Request
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    #{selectedRecord.request.id}
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecord(null)
                  }
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xl transition hover:bg-slate-700"
                >
                  ✕
                </button>

              </div>

              {/* Request Details */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl bg-slate-950 p-4">

                  <p className="text-xs text-slate-500">
                    Student ID
                  </p>

                  <p className="mt-1 font-bold">
                    {
                      selectedRecord
                        .request.student_id
                    }
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-950 p-4">

                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      selectedRecord
                        .request.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedRecord
                        .request.status
                    )}
                  </span>

                </div>

                <div className="rounded-2xl bg-slate-950 p-4">

                  <p className="text-xs text-slate-500">
                    Applied At
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(
                      selectedRecord
                        .request.applied_at
                    )}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-950 p-4">

                  <p className="text-xs text-slate-500">
                    Completed At
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(
                      selectedRecord
                        .request.completed_at
                    )}
                  </p>

                </div>

              </div>

              {/* Reason */}

              <div className="mt-4 rounded-2xl bg-slate-950 p-4">

                <p className="text-xs text-slate-500">
                  Reason
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {selectedRecord.request.reason ||
                    "No reason provided."}
                </p>

              </div>

              {/* Approval Details */}

              <div className="mt-6">

                <h3 className="text-xl font-bold">
                  Department Approvals
                </h3>

                <div className="mt-4 space-y-3">

                  {selectedRecord.approvals.map(
                    (approval) => (
                      <div
                        key={approval.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div>

                          <p className="font-bold">
                            {getDepartmentLabel(
                              approval.department
                            )}
                          </p>

                          {approval.remarks && (
                            <p className="mt-1 text-sm text-slate-500">
                              {approval.remarks}
                            </p>
                          )}

                          {approval.approved_at && (
                            <p className="mt-1 text-xs text-slate-600">
                              {formatDate(
                                approval.approved_at
                              )}
                            </p>
                          )}

                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            approval.status
                          )}`}
                        >
                          {getStatusLabel(
                            approval.status
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* Modal Footer */}

              <div className="mt-6 flex justify-end gap-3">

                {selectedRecord.request.status ===
                  "completed" && (
                  <a
                    href={`/api/no-dues/${selectedRecord.request.id}/certificate`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-bold transition hover:bg-emerald-500"
                  >
                    📄 Download Certificate
                  </a>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRecord(null)
                  }
                  className="rounded-xl bg-slate-800 px-5 py-3 font-bold transition hover:bg-slate-700"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </AuthGuard>
  );
}