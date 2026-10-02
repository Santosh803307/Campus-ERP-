"use client";

import { useCallback, useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource: string;
  resource_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogCountResponse {
  total: number;
}

export default function AuditLogsPage() {
  // =========================================================
  // STATE
  // =========================================================

  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [total, setTotal] = useState(0);

  const [action, setAction] = useState("");

  const [resource, setResource] = useState("");

  // =========================================================
  // LOAD AUDIT LOGS
  // =========================================================

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params: {
        page: number;
        limit: number;
        action?: string;
        resource?: string;
      } = {
        page,
        limit,
      };

      if (action.trim()) {
        params.action = action.trim();
      }

      if (resource.trim()) {
        params.resource = resource.trim();
      }

      const [logsResponse, countResponse] =
        await Promise.all([
          api.get<AuditLog[]>(
            "/api/audit-logs",
            {
              params,
            }
          ),

          api.get<AuditLogCountResponse>(
            "/api/audit-logs/count",
            {
              params: {
                action: action.trim() || undefined,
                resource:
                  resource.trim() || undefined,
              },
            }
          ),
        ]);

      setLogs(logsResponse.data);

      setTotal(countResponse.data.total);
    } catch (err: any) {
      console.error(
        "Failed to load audit logs:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, resource]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // =========================================================
  // FILTER
  // =========================================================

  function applyFilters() {
    setPage(1);
    setSuccess("");
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  function clearFilters() {
    setAction("");
    setResource("");
    setPage(1);
    setSuccess("");
    setError("");
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    total > 0
      ? Math.ceil(total / limit)
      : 1;

  const hasPreviousPage = page > 1;

  const hasNextPage =
    page < totalPages;

  function goToPreviousPage() {
    if (hasPreviousPage) {
      setPage((current) => current - 1);
    }
  }

  function goToNextPage() {
    if (hasNextPage) {
      setPage((current) => current + 1);
    }
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "medium",
      }
    );
  }

  // =========================================================
  // ACTION BADGE
  // =========================================================

  function getActionClass(actionName: string) {
    const normalized =
      actionName.toUpperCase();

    if (
      normalized.includes("LOGIN")
    ) {
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    }

    if (
      normalized.includes("APPROVED") ||
      normalized.includes("SUCCESS")
    ) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    }

    if (
      normalized.includes("REJECTED") ||
      normalized.includes("FAILED")
    ) {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }

    if (
      normalized.includes("APPLIED") ||
      normalized.includes("CREATED")
    ) {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    }

    return "border-slate-700 bg-slate-800 text-slate-300";
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
                Audit Logs
              </h1>

              <p className="mt-2 text-slate-400">
                Monitor important activities and
                security events across the ERP system.
              </p>

            </div>

            <button
              type="button"
              onClick={loadAuditLogs}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

          </div>

          {/* =================================================
              SUCCESS
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
              SUMMARY
          ================================================= */}

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Total Logs */}

            <div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Total Audit Logs
                  </p>

                  <p className="mt-2 text-4xl font-bold text-blue-400">
                    {total}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  📝
                </div>

              </div>

            </div>

            {/* Current Page */}

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Current Page
                  </p>

                  <p className="mt-2 text-4xl font-bold text-purple-400">
                    {page}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
                  📄
                </div>

              </div>

            </div>

            {/* Records */}

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Records on Page
                  </p>

                  <p className="mt-2 text-4xl font-bold text-emerald-400">
                    {logs.length}
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
                  📊
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5">

              <h2 className="text-xl font-bold">
                🔎 Filters
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Filter audit logs by action or resource.
              </p>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Action */}

              <div>

                <label
                  htmlFor="audit-action"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Action
                </label>

                <input
                  id="audit-action"
                  type="text"
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyFilters();
                    }
                  }}
                  placeholder="e.g. LOGIN"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* Resource */}

              <div>

                <label
                  htmlFor="audit-resource"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Resource
                </label>

                <input
                  id="audit-resource"
                  type="text"
                  value={resource}
                  onChange={(event) =>
                    setResource(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyFilters();
                    }
                  }}
                  placeholder="e.g. no_dues"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500"
              >
                🔎 Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-800 px-5 py-3 font-bold transition hover:bg-slate-700"
              >
                ✕ Clear Filters
              </button>

            </div>

          </section>

          {/* =================================================
              AUDIT LOG TABLE
          ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 p-6">

              <h2 className="text-xl font-bold">
                Audit Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest system activity appears first.
              </p>

            </div>

            {/* Loading */}

            {loading ? (

              <div className="p-12 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading audit logs...
                </p>

              </div>

            ) : logs.length === 0 ? (

              /* Empty */

              <div className="p-12 text-center">

                <div className="text-5xl">
                  📭
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No Audit Logs Found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing your filters or
                  perform an action in the ERP.
                </p>

              </div>

            ) : (

              /* =================================================
                 DESKTOP TABLE
              ================================================= */

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full text-left">

                  <thead className="border-b border-slate-800 bg-slate-950/70">

                    <tr>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        ID
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        User
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Resource
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Description
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date & Time
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-800">

                    {logs.map((log) => (

                      <tr
                        key={log.id}
                        className="transition hover:bg-slate-800/40"
                      >

                        {/* ID */}

                        <td className="px-6 py-5">

                          <span className="font-mono text-sm text-slate-400">
                            #{log.id}
                          </span>

                        </td>

                        {/* USER */}

                        <td className="px-6 py-5">

                          <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-semibold">
                            {log.user_id
                              ? `User #${log.user_id}`
                              : "System"}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getActionClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>

                        </td>

                        {/* RESOURCE */}

                        <td className="px-6 py-5">

                          <div>

                            <p className="font-semibold text-white">
                              {log.resource}
                            </p>

                            {log.resource_id && (
                              <p className="mt-1 text-xs text-slate-500">
                                ID: {log.resource_id}
                              </p>
                            )}

                          </div>

                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-md px-6 py-5">

                          <p className="text-sm leading-6 text-slate-300">
                            {log.description ||
                              "No description"}
                          </p>

                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-6 py-5">

                          <p className="text-sm font-semibold text-slate-300">
                            {formatDate(
                              log.created_at
                            )}
                          </p>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

            {/* =================================================
                MOBILE CARDS
            ================================================= */}

            {!loading &&
              logs.length > 0 && (
                <div className="grid gap-4 p-4 lg:hidden">

                  {logs.map((log) => (

                    <div
                      key={log.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <span className="font-mono text-sm text-slate-500">
                          #{log.id}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getActionClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>

                      </div>

                      <div className="mt-5 space-y-4">

                        <div>

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            User
                          </p>

                          <p className="mt-1 font-semibold">
                            {log.user_id
                              ? `User #${log.user_id}`
                              : "System"}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Resource
                          </p>

                          <p className="mt-1 font-semibold">
                            {log.resource}
                          </p>

                          {log.resource_id && (
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {log.resource_id}
                            </p>
                          )}

                        </div>

                        <div>

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Description
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {log.description ||
                              "No description"}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Date & Time
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {formatDate(
                              log.created_at
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>
              )}

          </section>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Page{" "}
                <span className="font-bold text-white">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-bold text-white">
                  {totalPages}
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {total} total audit records
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage || loading}
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={!hasNextPage || loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>

            </div>

          </div>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">

            <h2 className="font-bold text-blue-300">
              🔐 Audit Trail
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Audit logs record important activities
              performed across Campus ERP. These records
              help administrators monitor authentication,
              payments, No-Dues approvals and other
              important system operations.
            </p>

          </div>

        </div>
      </main>
    </AuthGuard>
  );
}