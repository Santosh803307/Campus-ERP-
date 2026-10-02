"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";

import {
  getPendingNoDues,
  updateNoDuesApproval,
  PendingNoDues,
} from "@/services/noDuesService";

type ActionType = "approved" | "rejected";

/* =========================
   ICONS
========================= */

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

/* =========================
   PAGE
========================= */

export default function NoDuesApprovalPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [requests, setRequests] = useState<PendingNoDues[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("all");

  const [selectedRequest, setSelectedRequest] =
    useState<PendingNoDues | null>(null);

  const [action, setAction] =
    useState<ActionType | null>(null);

  const [remarks, setRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);

  /* =========================
     ALLOWED STAFF ROLES
  ========================= */

  const allowedRoles = [
    "library",
    "accounts",
    "warden",
    "lab",
    "hod",
    "admin",
  ];

  /* =========================
     LOAD REQUESTS
  ========================= */

  useEffect(() => {
    /*
     * Wait until AuthProvider
     * restores the token.
     */
    if (authLoading) {
      return;
    }

    /*
     * Not logged in.
     * AuthGuard will redirect.
     */
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    /*
     * Do not call staff API for
     * student or unauthorized roles.
     */
    if (!allowedRoles.includes(user.role)) {
      setLoading(false);
      return;
    }

    loadRequests();
  }, [authLoading, isAuthenticated, user]);

  async function loadRequests(showRefreshLoader = false) {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getPendingNoDues();

      setRequests(data);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to view No-Dues approvals."
        );
      } else {
        setError(
          err?.response?.data?.detail ||
            "Unable to load pending No-Dues requests."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =========================
     DEPARTMENTS
  ========================= */

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        requests
          .map((item) => item.department)
          .filter(Boolean)
      )
    );
  }, [requests]);

  /* =========================
     FILTER REQUESTS
  ========================= */

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const studentName =
        request.student_name?.toLowerCase() || "";

      const enrollment =
        request.enrollment_no?.toLowerCase() || "";

      const department =
        request.department?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        enrollment.includes(query) ||
        department.includes(query);

      const matchesDepartment =
        departmentFilter === "all" ||
        request.department === departmentFilter;

      return (
        matchesSearch &&
        matchesDepartment
      );
    });
  }, [
    requests,
    search,
    departmentFilter,
  ]);

  /* =========================
     ACTION MODAL
  ========================= */

  function openAction(
    request: PendingNoDues,
    actionType: ActionType
  ) {
    setSelectedRequest(request);
    setAction(actionType);
    setRemarks("");
    setError("");
  }

  function closeAction() {
    if (submitting) {
      return;
    }

    setSelectedRequest(null);
    setAction(null);
    setRemarks("");
  }

  /* =========================
     APPROVE / REJECT
  ========================= */

  async function submitAction() {
    if (!selectedRequest || !action) {
      return;
    }

    if (
      action === "rejected" &&
      !remarks.trim()
    ) {
      setError(
        "Please enter remarks before rejecting a request."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await updateNoDuesApproval(
        selectedRequest.request_id,
        {
          status: action,
          remarks:
            remarks.trim() || undefined,
        }
      );

      /*
       * Close modal after successful API call.
       */
      setSelectedRequest(null);
      setAction(null);
      setRemarks("");

      /*
       * Reload current staff queue.
       */
      await loadRequests();
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to perform this action."
        );
      } else {
        setError(
          err?.response?.data?.detail ||
            "Unable to update No-Dues approval."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = requests.length;

  /* =========================
     AUTH LOADING
  ========================= */

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="text-sm text-slate-500">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     MAIN UI
  ========================= */

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* Background decoration */}

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* =========================
              HEADER
          ========================= */}

          <header className="mb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

                  STAFF SERVICES
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  No-Dues Approvals
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                  Review and process student No-Dues clearance
                  requests.
                </p>

                {user && (
                  <p className="mt-2 text-xs text-slate-600">
                    Signed in as{" "}
                    <span className="text-slate-400">
                      {user.email}
                    </span>
                    {" • "}
                    <span className="capitalize">
                      {user.role}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Refresh */}

                <button
                  type="button"
                  onClick={() =>
                    loadRequests(true)
                  }
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  >
                    <RefreshIcon />
                  </span>

                  Refresh
                </button>

                {/* Pending count */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="text-xs text-slate-500">
                    Pending Requests
                  </p>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-1 text-red-300/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 text-red-300/60 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <XIcon />
              </button>
            </div>
          )}

          {/* =========================
              FILTERS
          ========================= */}

          <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              {/* Search */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <SearchIcon />
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search student, enrollment or department..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Department */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </label>

                <select
                  value={departmentFilter}
                  onChange={(e) =>
                    setDepartmentFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60"
                >
                  <option value="all">
                    All Departments
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department}
                        value={department}
                      >
                        {department}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Filter result count */}

            {!loading && (
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                <p className="text-xs text-slate-600">
                  Showing{" "}
                  <span className="font-semibold text-slate-400">
                    {filteredRequests.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-400">
                    {requests.length}
                  </span>{" "}
                  pending requests
                </p>

                {(search ||
                  departmentFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setDepartmentFilter(
                        "all"
                      );
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>

          {/* =========================
              LOADING
          ========================= */}

          {loading && (
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                  />
                )
              )}
            </div>
          )}

          {/* =========================
              EMPTY
          ========================= */}

          {!loading &&
            filteredRequests.length ===
              0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <CheckIcon />
                </div>

                <h2 className="mt-5 text-xl font-bold text-white">
                  {requests.length === 0
                    ? "No Pending Requests"
                    : "No Matching Requests"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {requests.length === 0
                    ? "There are currently no No-Dues requests waiting for your approval."
                    : "Try changing your search text or department filter."}
                </p>
              </section>
            )}

          {/* =========================
              REQUEST CARDS
          ========================= */}

          {!loading &&
            filteredRequests.length >
              0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredRequests.map(
                  (request) => (
                    <article
                      key={
                        request.approval_id
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      {/* Top */}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            <ClockIcon />
                          </div>

                          <div>
                            <h2 className="font-bold text-white">
                              {request.student_name ||
                                `Student #${request.student_id}`}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              Request #
                              {
                                request.request_id
                              }
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold capitalize text-amber-400">
                          {request.status}
                        </span>
                      </div>

                      {/* Student information */}

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-900/70 p-3">
                          <p className="text-xs text-slate-600">
                            Enrollment
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-300">
                            {request.enrollment_no ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-900/70 p-3">
                          <p className="text-xs text-slate-600">
                            Department
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize text-slate-300">
                            {
                              request.department
                            }
                          </p>
                        </div>
                      </div>

                      {/* Reason */}

                      <div className="mt-4">
                        <p className="text-xs text-slate-600">
                          Application Reason
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                          {request.reason ||
                            "No reason provided by student."}
                        </p>
                      </div>

                      {/* Date */}

                      <p className="mt-4 text-xs text-slate-600">
                        Applied on{" "}
                        {new Date(
                          request.applied_at
                        ).toLocaleDateString()}
                      </p>

                      {/* Actions */}

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            openAction(
                              request,
                              "rejected"
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                        >
                          <XIcon />
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAction(
                              request,
                              "approved"
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                        >
                          <CheckIcon />
                          Approve
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </div>

        {/* =========================
            ACTION MODAL
        ========================= */}

        {selectedRequest &&
          action && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeAction();
                }
              }}
            >
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                {/* Modal Header */}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {action === "approved"
                        ? "Approve No-Dues"
                        : "Reject No-Dues"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedRequest.student_name ||
                        `Student #${selectedRequest.student_id}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeAction}
                    disabled={submitting}
                    className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XIcon />
                  </button>
                </div>

                {/* Request information */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-600">
                      Department
                    </p>

                    <p className="mt-1 font-semibold capitalize text-slate-300">
                      {
                        selectedRequest.department
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-600">
                      Request
                    </p>

                    <p className="mt-1 font-semibold text-slate-300">
                      #
                      {
                        selectedRequest.request_id
                      }
                    </p>
                  </div>
                </div>

                {/* Existing reason */}

                {selectedRequest.reason && (
                  <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-600">
                      Student's Reason
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {
                        selectedRequest.reason
                      }
                    </p>
                  </div>
                )}

                {/* Remarks */}

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Remarks

                    {action ===
                      "rejected" && (
                      <span className="ml-1 text-red-400">
                        *
                      </span>
                    )}
                  </label>

                  <textarea
                    value={remarks}
                    onChange={(e) =>
                      setRemarks(
                        e.target.value
                      )
                    }
                    rows={4}
                    maxLength={500}
                    disabled={submitting}
                    placeholder={
                      action === "approved"
                        ? "Add approval remarks..."
                        : "Enter reason for rejection..."
                    }
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <div className="mt-1 text-right text-xs text-slate-600">
                    {remarks.length}/500
                  </div>
                </div>

                {/* Modal Actions */}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={closeAction}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={submitAction}
                    className={`rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      action === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-red-600 hover:bg-red-500"
                    }`}
                  >
                    {submitting
                      ? "Processing..."
                      : action ===
                        "approved"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>
    </AuthGuard>
  );
}