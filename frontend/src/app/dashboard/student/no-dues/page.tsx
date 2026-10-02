"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  applyForNoDues,
  getMyNoDues,
  NoDuesApproval,
  MyNoDuesResponse,
  downloadNoDuesCertificate,
} from "@/services/noDuesService";

type DepartmentConfig = {
  key: string;
  name: string;
  description: string;
};

const DEPARTMENTS: DepartmentConfig[] = [
  {
    key: "library",
    name: "Library",
    description: "Library dues and issued books",
  },
  {
    key: "accounts",
    name: "Accounts",
    description: "Fee and financial clearance",
  },
  {
    key: "hostel",
    name: "Hostel",
    description: "Hostel and accommodation clearance",
  },
  {
    key: "lab",
    name: "Lab",
    description: "Laboratory equipment clearance",
  },
  {
    key: "department",
    name: "Department",
    description: "Academic department clearance",
  },
];

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

function FileIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-label="Loading"
    />
  );
}

/* =========================
   PAGE
========================= */

export default function StudentNoDuesPage() {
  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [data, setData] = useState<MyNoDuesResponse | null>(null);

  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);

  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");

  /* =========================
     LOAD NO-DUES
  ========================= */

  useEffect(() => {
    /*
     Don't call API until AuthProvider
     has restored the JWT token.
    */
    if (authLoading) {
      return;
    }

    /*
     If user is not authenticated,
     AuthGuard will redirect.
    */
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    /*
     Extra frontend protection.
    Only student should load this page.
    */
    if (user.role !== "student") {
      setLoading(false);
      return;
    }

    loadNoDues();
  }, [authLoading, isAuthenticated, user]);

  async function loadNoDues() {
    try {
      setLoading(true);
      setError("");

      const response = await getMyNoDues();

      setData(response);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 404) {
        /*
         Student has not applied yet.
        */
        setData(null);
        setError("");
      } else if (status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to view this page."
        );
      } else {
        setError(
          err?.response?.data?.detail ||
          "Unable to load your No-Dues request."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     APPLY NO-DUES
  ========================= */

  async function handleApply(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setApplying(true);
      setError("");

      const request = await applyForNoDues({
        reason: reason.trim() || undefined,
      });

      /*
       * Fetch complete request including
       * all department approvals.
       */
      const response = await getMyNoDues();

      setData({
        request,
        approvals: response.approvals,
      });

      setReason("");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        "Unable to submit No-Dues application."
      );
    } finally {
      setApplying(false);
    }
  }

  /* =========================
   DOWNLOAD CERTIFICATE
========================= */

  async function handleDownloadCertificate() {
    if (!data?.request?.id) {
      return;
    }

    try {
      const blob = await downloadNoDuesCertificate(
        data.request.id
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `No-Dues-Certificate-${data.request.id}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(
        "Certificate download failed:",
        error
      );

      alert(
        error?.response?.data?.detail ||
        "Unable to download No-Dues certificate."
      );
    }
  }

  /* =========================
     APPROVAL DATA
  ========================= */

  const approvals = data?.approvals ?? [];

  const approvedCount = useMemo(() => {
    return approvals.filter(
      (approval) =>
        approval.status.toLowerCase() === "approved"
    ).length;
  }, [approvals]);

  const rejectedCount = useMemo(() => {
    return approvals.filter(
      (approval) =>
        approval.status.toLowerCase() === "rejected"
    ).length;
  }, [approvals]);

  const progress = Math.round(
    (approvedCount / DEPARTMENTS.length) * 100
  );

  const isCompleted =
    data?.request.status.toLowerCase() === "completed";

  const isRejected =
    data?.request.status.toLowerCase() === "rejected";

  /* =========================
     HELPERS
  ========================= */

  function getApproval(
    departmentKey: string
  ): NoDuesApproval | undefined {
    return approvals.find(
      (approval) =>
        approval.department.toLowerCase() ===
        departmentKey.toLowerCase()
    );
  }

  function getStatusStyles(status?: string) {
    switch (status?.toLowerCase()) {
      case "approved":
        return {
          badge:
            "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
          icon:
            "bg-emerald-100 text-emerald-600",
          progress: "bg-emerald-500",
        };

      case "rejected":
        return {
          badge:
            "bg-red-50 text-red-700 ring-1 ring-red-200",
          icon:
            "bg-red-100 text-red-600",
          progress: "bg-red-500",
        };

      default:
        return {
          badge:
            "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
          icon:
            "bg-amber-100 text-amber-600",
          progress:
            "bg-amber-500",
        };
    }
  }

  function renderStatusIcon(status?: string) {
    if (
      status?.toLowerCase() === "approved"
    ) {
      return <CheckIcon />;
    }

    if (
      status?.toLowerCase() === "rejected"
    ) {
      return <XIcon />;
    }

    return <ClockIcon />;
  }

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
     PAGE LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-slate-800" />

            <div className="h-32 rounded-2xl bg-slate-900" />

            <div className="h-96 rounded-2xl bg-slate-900" />
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <AuthGuard allowedRoles={["student"]}>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* Background decoration */}

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* =========================
              HEADER
          ========================= */}

          <header className="mb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

                  STUDENT SERVICES
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  No-Dues Certificate
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Track your digital No-Dues clearance from all
                  required departments in one place.
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-400 shadow-xl shadow-black/10">
                <FileIcon />
              </div>
            </div>
          </header>

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <div className="mt-0.5">
                <XIcon />
              </div>

              <div>
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-1 text-red-300/80">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* =========================
              NO REQUEST
          ========================= */}

          {(!data ||
            data.request.status.toLowerCase() === "completed" ||
            data.request.status.toLowerCase() === "rejected") && (
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">

                <div className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-6 sm:p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                    <FileIcon />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-white">
                    Apply for No-Dues
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Submit a new No-Dues application for departmental
                    verification.
                  </p>
                </div>

                <form
                  onSubmit={handleApply}
                  className="p-6 sm:p-8"
                >
                  <label
                    htmlFor="reason"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Reason
                    <span className="ml-1 font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    maxLength={500}
                    rows={5}
                    placeholder="Enter reason for No-Dues application..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <div className="mt-2 flex justify-end text-xs text-slate-500">
                    {reason.length}/500
                  </div>

                  <button
                    type="submit"
                    disabled={applying}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {applying ? (
                      <>
                        <Spinner />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Apply for No-Dues
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

          {/* =========================
              EXISTING REQUEST
          ========================= */}

          {data && (
            <>
              {/* =========================
                  OVERALL STATUS
              ========================= */}

              <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Overall Status
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-bold capitalize text-white">
                          {data.request.status.replace(
                            "_",
                            " "
                          )}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${isCompleted
                            ? "bg-emerald-500/15 text-emerald-400"
                            : isRejected
                              ? "bg-red-500/15 text-red-400"
                              : "bg-amber-500/15 text-amber-400"
                            }`}
                        >
                          {isCompleted
                            ? "Completed"
                            : isRejected
                              ? "Action Required"
                              : "Processing"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Request #{data.request.id} •{" "}
                        {new Date(
                          data.request.applied_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">
                          {approvedCount}

                          <span className="text-slate-500">
                            /{DEPARTMENTS.length}
                          </span>
                        </p>

                        <p className="text-xs font-medium text-slate-500">
                          Departments cleared
                        </p>
                      </div>

                      <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 p-1">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500/10">
                          <span className="text-sm font-bold text-blue-400">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}

                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-500">
                        Clearance progress
                      </span>

                      <span className="font-semibold text-slate-300">
                        {approvedCount}/
                        {DEPARTMENTS.length}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isRejected
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-blue-500 to-cyan-400"
                          }`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* =========================
                  COMPLETION
              ========================= */}

              {isCompleted && (
                <section className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <CheckIcon />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white">
                          No-Dues Completed
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          All required departments have approved
                          your No-Dues request.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadCertificate}
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                    >
                      Download Certificate
                    </button>
                  </div>
                </section>
              )}

              {/* =========================
                  REJECTED
              ========================= */}

              {isRejected && (
                <section className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                      <XIcon />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">
                        No-Dues Request Requires Attention
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        One or more departments have rejected this
                        request. Please check the department remarks.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* =========================
                  DEPARTMENT APPROVALS
              ========================= */}

              <section>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      Department Approvals
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Clearance status from every required department.
                    </p>
                  </div>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400">
                    {approvedCount}/
                    {DEPARTMENTS.length} Approved
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {DEPARTMENTS.map(
                    (department, index) => {
                      const approval =
                        getApproval(department.key);

                      const status =
                        approval?.status || "pending";

                      const styles =
                        getStatusStyles(status);

                      return (
                        <article
                          key={department.key}
                          className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-200 hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                            >
                              {renderStatusIcon(
                                status
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-xs font-medium text-slate-600">
                                    STEP {index + 1}
                                  </p>

                                  <h3 className="mt-0.5 text-base font-bold text-white">
                                    {department.name}
                                  </h3>
                                </div>

                                <span
                                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles.badge}`}
                                >
                                  {status}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-5 text-slate-500">
                                {approval?.remarks ||
                                  department.description}
                              </p>

                              {approval?.approved_at && (
                                <p className="mt-3 text-xs text-slate-600">
                                  Updated{" "}
                                  {new Date(
                                    approval.approved_at
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>

              {/* =========================
                  APPLICATION DETAILS
              ========================= */}

              <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-bold text-slate-300">
                  Application Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-600">
                      Request ID
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      #{data.request.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">
                      Applied On
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {new Date(
                        data.request.applied_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">
                      Rejected Departments
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {rejectedCount}
                    </p>
                  </div>
                </div>

                {data.request.reason && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="text-xs text-slate-600">
                      Application Reason
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {data.request.reason}
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}