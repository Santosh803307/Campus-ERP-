"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getHealthStatus,
  HealthResponse,
} from "@/services/healthService";

const features = [
  {
    icon: "📊",
    title: "Smart Dashboard",
    description:
      "Role-based dashboards for students, faculty, departments and administrators.",
  },
  {
    icon: "🎓",
    title: "Student Services",
    description:
      "Attendance, examinations, results, documents, fees and academic information.",
  },
  {
    icon: "📄",
    title: "Paperless Documents",
    description:
      "Secure digital document management with cloud-based PDF storage and access.",
  },
  {
    icon: "💳",
    title: "Online Fee Management",
    description:
      "Manage student fees, payments, receipts and transaction history digitally.",
  },
  {
    icon: "🛡️",
    title: "Secure Access",
    description:
      "JWT authentication, role-based authorization and protected campus services.",
  },
  {
    icon: "⚡",
    title: "Fast & Scalable",
    description:
      "Modern API-first architecture designed for reliable campus operations.",
  },
];

const roles = [
  "Students",
  "Faculty",
  "HOD",
  "Library",
  "Accounts",
  "Warden",
  "Security",
  "Admin",
];

const workflow = [
  {
    number: "01",
    title: "Login",
    description:
      "Securely access your personalized Campus ERP dashboard.",
  },
  {
    number: "02",
    title: "Manage",
    description:
      "Access academic, administrative and operational services.",
  },
  {
    number: "03",
    title: "Process",
    description:
      "Complete requests, approvals, payments and digital workflows.",
  },
  {
    number: "04",
    title: "Track",
    description:
      "Monitor status, records, notifications and important activities.",
  },
];

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getHealthStatus();
        setHealth(data);
      } catch (err) {
        console.error(err);
        setError("Backend connection failed");
      } finally {
        setLoading(false);
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* ========================================================= */}
      {/* BACKGROUND EFFECTS */}
      {/* ========================================================= */}

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute right-0 top-[600px] h-[400px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />

        <div className="absolute left-0 top-[1200px] h-[400px] w-[500px] rounded-full bg-cyan-600/5 blur-[120px]" />
      </div>

      {/* ========================================================= */}
      {/* NAVBAR */}
      {/* ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-600/20 transition group-hover:scale-105">
                CE
              </div>

              <div>
                <p className="font-bold tracking-wide text-white">
                  CAMPUS ERP
                </p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Smart Campus Platform
                </p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:inline-flex">
              ● System Online
            </span>

            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-500/30"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            {/* LEFT */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Modern Digital Campus Infrastructure
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                One Platform.
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Complete Campus.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
                Campus ERP is a smart, scalable and paperless platform
                designed to simplify academic, administrative and
                operational services for modern institutions.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3.5 font-semibold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Access Campus ERP
                  <span className="ml-2">→</span>
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-7 py-3.5 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust points */}
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
                <span>✓ Role-based access</span>
                <span>✓ Paperless workflows</span>
                <span>✓ Cloud-ready</span>
              </div>
            </div>

            {/* RIGHT DASHBOARD PREVIEW */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-blue-600/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/40">
                {/* Fake browser header */}
                <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <span className="h-3 w-3 rounded-full bg-green-400/80" />

                  <div className="ml-4 h-7 flex-1 rounded-lg bg-slate-800" />
                </div>

                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        CAMPUS ERP
                      </p>
                      <h3 className="mt-1 text-xl font-bold">
                        Dashboard
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                      👤
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Attendance
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        75%
                      </p>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[75%] rounded-full bg-blue-500" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Documents
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        08
                      </p>

                      <p className="mt-2 text-xs text-emerald-400">
                        All available
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Examinations
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        04
                      </p>

                      <p className="mt-2 text-xs text-blue-400">
                        Upcoming
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs text-slate-500">
                        Fees
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        Paid
                      </p>

                      <p className="mt-2 text-xs text-emerald-400">
                        ✓ Completed
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Recent Activity
                      </p>

                      <span className="text-xs text-slate-500">
                        Today
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-center leading-8">
                          📄
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            Document uploaded
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Marksheet
                          </p>
                        </div>

                        <span className="text-[10px] text-emerald-400">
                          Done
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-center leading-8">
                          📝
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            Examination scheduled
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Data Structures
                          </p>
                        </div>

                        <span className="text-[10px] text-blue-400">
                          New
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STATS */}
      {/* ========================================================= */}

      <section className="border-y border-slate-800/70 bg-slate-900/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-800/70 px-6 lg:grid-cols-4 lg:px-8">
          <div className="px-5 py-8 text-center">
            <p className="text-3xl font-black text-white">8+</p>
            <p className="mt-1 text-sm text-slate-500">
              User Roles
            </p>
          </div>

          <div className="px-5 py-8 text-center">
            <p className="text-3xl font-black text-white">24/7</p>
            <p className="mt-1 text-sm text-slate-500">
              Digital Access
            </p>
          </div>

          <div className="border-t border-slate-800/70 px-5 py-8 text-center lg:border-t-0">
            <p className="text-3xl font-black text-white">100%</p>
            <p className="mt-1 text-sm text-slate-500">
              Paperless Workflow
            </p>
          </div>

          <div className="border-t border-slate-800/70 px-5 py-8 text-center lg:border-t-0">
            <p className="text-3xl font-black text-white">
              API
            </p>
            <p className="mt-1 text-sm text-slate-500">
              First Architecture
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURES */}
      {/* ========================================================= */}

      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Platform Features
          </span>

          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything your campus needs
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            A unified platform to manage academic, administrative
            and operational activities from one place.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl transition group-hover:bg-blue-500/20">
                {feature.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold">
                {feature.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* WORKFLOW */}
      {/* ========================================================= */}

      <section className="border-y border-slate-800/70 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Simple Workflow
              </span>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                From request to completion
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                Replace manual paperwork with transparent digital
                workflows that are easier to manage and track.
              </p>

              <Link
                href="/login"
                className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Get Started →
              </Link>
            </div>

            <div className="space-y-4">
              {workflow.map((item) => (
                <div
                  key={item.number}
                  className="group flex gap-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-blue-500/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
                    {item.number}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">
                      {item.title}
                    </h3>

                    <p className="mt-1 leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ROLES */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Built for Everyone
          </span>

          <h2 className="mt-4 text-4xl font-bold">
            One platform, multiple roles
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Each role gets the tools and permissions needed for
            their responsibilities.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {roles.map((role) => (
            <div
              key={role}
              className="rounded-full border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-500/30 hover:text-white"
            >
              {role}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SYSTEM STATUS */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl">
          <div className="border-b border-slate-800 px-7 py-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-400">
                  Infrastructure
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  System Status
                </h2>
              </div>

              {!loading && !error && health && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  All Systems Operational
                </span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {/* API */}
            <div className="border-b border-slate-800 p-6 lg:border-b-0 lg:border-r">
              <p className="text-sm text-slate-500">
                API
              </p>

              {loading ? (
                <p className="mt-3 text-sm text-yellow-400">
                  Checking...
                </p>
              ) : error ? (
                <p className="mt-3 text-sm text-red-400">
                  Offline
                </p>
              ) : (
                <p className="mt-3 flex items-center gap-2 font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Online
                </p>
              )}
            </div>

            {/* DATABASE */}
            <div className="border-b border-slate-800 p-6 lg:border-b-0 lg:border-r">
              <p className="text-sm text-slate-500">
                Database
              </p>

              <p className="mt-3 flex items-center gap-2 font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                {loading
                  ? "Checking..."
                  : health?.services.database ?? "Unavailable"}
              </p>
            </div>

            {/* REDIS */}
            <div className="border-b border-slate-800 p-6 sm:border-r lg:border-b-0">
              <p className="text-sm text-slate-500">
                Redis
              </p>

              <p className="mt-3 flex items-center gap-2 font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                {loading
                  ? "Checking..."
                  : health?.services.redis ?? "Unavailable"}
              </p>
            </div>

            {/* VERSION */}
            <div className="p-6">
              <p className="text-sm text-slate-500">
                API Version
              </p>

              <p className="mt-3 font-semibold text-white">
                {loading
                  ? "..."
                  : health?.version ?? "1.0.0"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CTA */}
      {/* ========================================================= */}

      <section className="px-6 pb-24 lg:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-900 p-10 text-center sm:p-14">
          <div className="absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Ready to get started?
            </span>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Access your Campus ERP
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Students, faculty and administrators can access
              their respective dashboards through one secure platform.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Go to Login
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="font-bold text-white">
              CAMPUS ERP
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Administration & Operational Services
            </p>
          </div>

          <div className="text-sm text-slate-600">
            © {new Date().getFullYear()} Campus ERP. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}