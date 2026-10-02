"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface AnalyticsData {
  users: {
    total: number;
    active: number;
  };
  students: {
    total: number;
  };
  faculty: {
    total: number;
  };
  departments: {
    total: number;
  };
  no_dues: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
  };
  out_pass: {
    total: number;
    pending: number;
    approved: number;
    returned: number;
  };
  payments: {
    total_transactions: number;
    successful_transactions: number;
    total_collected: number;
  };
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition hover:border-slate-700 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
      <h2 className="mb-5 text-xl font-bold text-white">
        {title}
      </h2>

      {children}
    </div>
  );
}

export default function AdminReportsPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<AnalyticsData>(
        "/api/analytics/overview"
      );

      setAnalytics(response.data);
    } catch (err: any) {
      console.error("Analytics error:", err);

      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err?.response?.status === 403) {
        setError(
          "You do not have permission to view analytics."
        );
      } else {
        setError(
          "Unable to load analytics. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Reports & Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                Monitor users, students, payments, No-Dues,
                Out-Pass activity and overall campus operations.
              </p>
            </div>

            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh Data"}
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />

              <p className="mt-4 text-slate-400">
                Loading analytics...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6">
              <p className="font-semibold text-red-400">
                {error}
              </p>

              <button
                onClick={loadAnalytics}
                className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ANALYTICS */}
          {!loading && !error && analytics && (
            <>
              {/* OVERVIEW */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon="👥"
                  title="Total Users"
                  value={analytics.users.total}
                  subtitle={`${analytics.users.active} active users`}
                />

                <StatCard
                  icon="🎓"
                  title="Students"
                  value={analytics.students.total}
                  subtitle="Registered students"
                />

                <StatCard
                  icon="👨‍🏫"
                  title="Faculty"
                  value={analytics.faculty.total}
                  subtitle="Faculty members"
                />

                <StatCard
                  icon="🏢"
                  title="Departments"
                  value={analytics.departments.total}
                  subtitle="Academic departments"
                />
              </div>

              {/* PAYMENT + NO DUES */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">

                {/* PAYMENTS */}
                <SectionCard title="💳 Payment Overview">
                  <div className="grid gap-4 sm:grid-cols-3">

                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">
                        Transactions
                      </p>

                      <p className="mt-2 text-2xl font-bold text-white">
                        {analytics.payments.total_transactions}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">
                        Successful
                      </p>

                      <p className="mt-2 text-2xl font-bold text-green-400">
                        {
                          analytics.payments
                            .successful_transactions
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">
                        Collected
                      </p>

                      <p className="mt-2 text-2xl font-bold text-blue-400">
                        ₹
                        {analytics.payments.total_collected.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                  </div>
                </SectionCard>

                {/* NO DUES */}
                <SectionCard title="📄 No-Dues Overview">
                  <div className="grid gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">
                        Total Requests
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        {analytics.no_dues.total}
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow-950/30 p-4">
                      <p className="text-sm text-yellow-400">
                        Pending
                      </p>

                      <p className="mt-2 text-2xl font-bold text-yellow-400">
                        {analytics.no_dues.pending}
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-950/30 p-4">
                      <p className="text-sm text-green-400">
                        Completed
                      </p>

                      <p className="mt-2 text-2xl font-bold text-green-400">
                        {analytics.no_dues.completed}
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-950/30 p-4">
                      <p className="text-sm text-red-400">
                        Rejected
                      </p>

                      <p className="mt-2 text-2xl font-bold text-red-400">
                        {analytics.no_dues.rejected}
                      </p>
                    </div>

                  </div>
                </SectionCard>
              </div>

              {/* OUT PASS */}
              <div className="mt-6">
                <SectionCard title="🚪 Hostel Out-Pass Overview">

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-800/70 p-5">
                      <p className="text-sm text-slate-400">
                        Total Out-Passes
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {analytics.out_pass.total}
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow-950/30 p-5">
                      <p className="text-sm text-yellow-400">
                        Pending
                      </p>

                      <p className="mt-2 text-3xl font-bold text-yellow-400">
                        {analytics.out_pass.pending}
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-950/30 p-5">
                      <p className="text-sm text-blue-400">
                        Approved
                      </p>

                      <p className="mt-2 text-3xl font-bold text-blue-400">
                        {analytics.out_pass.approved}
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-950/30 p-5">
                      <p className="text-sm text-green-400">
                        Returned
                      </p>

                      <p className="mt-2 text-3xl font-bold text-green-400">
                        {analytics.out_pass.returned}
                      </p>
                    </div>

                  </div>

                </SectionCard>
              </div>

              {/* QUICK LINKS */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="text-3xl">📋</div>

                  <h2 className="mt-4 text-lg font-bold">
                    Audit Logs
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Track important administrative and system
                    activities.
                  </p>

                  <a
                    href="/dashboard/admin/audit-logs"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Open Audit Logs →
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="text-3xl">📄</div>

                  <h2 className="mt-4 text-lg font-bold">
                    No-Dues Management
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    View and monitor student No-Dues requests.
                  </p>

                  <a
                    href="/dashboard/admin/no-dues"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Open No-Dues →
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="text-3xl">💰</div>

                  <h2 className="mt-4 text-lg font-bold">
                    Fee Management
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Manage fee structures and payment records.
                  </p>

                  <a
                    href="/dashboard/admin/fees"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Open Fees →
                  </a>
                </div>

              </div>

              {/* FOOTER */}
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
                <p className="text-sm text-slate-500">
                  Campus ERP • Admin Analytics • Live Database
                  Statistics
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}