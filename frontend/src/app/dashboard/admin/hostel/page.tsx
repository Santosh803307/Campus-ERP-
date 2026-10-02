"use client";

import AuthGuard from "@/components/AuthGuard";

export default function AdminHostelPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">

          <p className="font-semibold text-blue-400">
            CAMPUS ERP
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Hostel Management
          </h1>

          <p className="mt-2 text-slate-400">
            Manage hostel services, Out-Passes and
            security activity.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-6">
              <div className="text-4xl">🏠</div>

              <h2 className="mt-5 text-xl font-bold">
                Hostel Management
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Manage hostel-related student services.
              </p>

              <button
                type="button"
                className="mt-5 rounded-xl bg-purple-600 px-5 py-3 font-bold transition hover:bg-purple-500"
              >
                Manage Hostel →
              </button>
            </div>

            <div className="rounded-3xl border border-yellow-500/20 bg-slate-900 p-6">
              <div className="text-4xl">🪪</div>

              <h2 className="mt-5 text-xl font-bold">
                Out-Pass System
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Monitor student Out-Pass requests and
                approvals.
              </p>

              <a
                href="/dashboard/warden"
                className="mt-5 inline-block rounded-xl bg-yellow-600 px-5 py-3 font-bold transition hover:bg-yellow-500"
              >
                Open Warden Portal →
              </a>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6">
              <div className="text-4xl">🔐</div>

              <h2 className="mt-5 text-xl font-bold">
                Security
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Monitor QR scans, exits and student returns.
              </p>

              <a
                href="/dashboard/security"
                className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold transition hover:bg-emerald-500"
              >
                Open Security →
              </a>
            </div>

          </div>

        </div>
      </main>
    </AuthGuard>
  );
}