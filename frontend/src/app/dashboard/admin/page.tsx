"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, logout } from "@/services/authService";
import { useRouter } from "next/navigation";
import GlobalSearch from "@/components/GlobalSearch";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    if (storedUser.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    setUser(storedUser);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="mt-4 text-sm text-slate-400">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

          {/* Brand */}
          <Link
            href="/dashboard/admin"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
              🏫
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="text-lg font-bold text-white">
                Administration
              </h1>
            </div>
          </Link>

          {/* Global Search */}
          <div className="w-full lg:flex-1 lg:px-10">
            <GlobalSearch />
          </div>

          {/* Right */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">

            {/* Admin Badge */}
            <div className="hidden items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-sm">
                👤
              </div>

              <div className="leading-tight">
                <p className="max-w-[120px] truncate text-sm font-semibold text-white">
                  {user.full_name}
                </p>

                <p className="text-[11px] uppercase tracking-wider text-blue-400">
                  Administrator
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* MAIN */}
      {/* ================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-6 shadow-2xl sm:p-8">

          {/* Background decorations */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  System Online
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome, {user.full_name} 👋
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Manage students, academics, fees, documents,
                  examinations and campus operations from one
                  centralized administration portal.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Access Level
                </p>

                <p className="mt-1 text-lg font-bold uppercase text-blue-400">
                  {user.role}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* QUICK STATS */}
        {/* ================================================== */}

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <QuickStat
            icon="👨‍🎓"
            title="Students"
            value="Manage"
            description="Student records"
            href="/dashboard/admin/students"
          />

          <QuickStat
            icon="👨‍🏫"
            title="Faculty"
            value="Manage"
            description="Faculty members"
            href="/dashboard/admin/faculty"
          />

          <QuickStat
            icon="💳"
            title="Fees"
            value="Manage"
            description="Payments & structures"
            href="/dashboard/admin/fees"
          />

          <QuickStat
            icon="📄"
            title="Documents"
            value="Manage"
            description="Academic documents"
            href="/dashboard/admin/documents"
          />

        </section>

        {/* ================================================== */}
        {/* ACCOUNT INFORMATION */}
        {/* ================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">

          <div className="border-b border-slate-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                👤
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Account Information
                </h3>

                <p className="text-xs text-slate-500">
                  Administrator account details
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3">

            <AccountItem
              label="Full Name"
              value={user.full_name}
              icon="👤"
            />

            <AccountItem
              label="Email Address"
              value={user.email}
              icon="✉️"
            />

            <AccountItem
              label="Role"
              value={user.role.toUpperCase()}
              icon="🛡️"
              highlight
            />

          </div>
        </section>

        {/* ================================================== */}
        {/* ERP MODULES */}
        {/* ================================================== */}

        <section>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                ERP Modules
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Access and manage campus operations.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              10 modules available
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            <DashboardCard
              title="Departments"
              description="Manage college departments and academic units."
              href="/dashboard/admin/departments"
              icon="🏢"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-400"
              onClick={() =>
                router.push("/dashboard/admin/departments")
              }
            />

            <DashboardCard
              title="Students"
              description="Manage student profiles, records and enrollment."
              href="/dashboard/admin/students"
              icon="🎓"
              iconBg="bg-cyan-500/10"
              iconColor="text-cyan-400"
              onClick={() =>
                router.push("/dashboard/admin/students")
              }
            />

            <DashboardCard
              title="Faculty"
              description="Manage faculty members and academic information."
              href="/dashboard/admin/faculty"
              icon="👨‍🏫"
              iconBg="bg-violet-500/10"
              iconColor="text-violet-400"
              onClick={() =>
                router.push("/dashboard/admin/faculty")
              }
            />

            <DashboardCard
              title="Fees"
              description="Manage fee structures, assignments and payments."
              href="/dashboard/admin/fees"
              icon="💳"
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-400"
              onClick={() =>
                router.push("/dashboard/admin/fees")
              }
            />

            <DashboardCard
              title="Examination"
              description="Manage exams, timetable and student results."
              href="/dashboard/admin/examination"
              icon="📝"
              iconBg="bg-orange-500/10"
              iconColor="text-orange-400"
              onClick={() =>
                router.push("/dashboard/admin/examination")
              }
            />

            <DashboardCard
              title="Notices"
              description="Create and manage college announcements."
              href="/dashboard/admin/notices"
              icon="📢"
              iconBg="bg-yellow-500/10"
              iconColor="text-yellow-400"
              onClick={() =>
                router.push("/dashboard/admin/notices")
              }
            />

            <DashboardCard
              title="Documents"
              description="Upload and manage student academic documents."
              href="/dashboard/admin/documents"
              icon="📄"
              iconBg="bg-pink-500/10"
              iconColor="text-pink-400"
              onClick={() =>
                router.push("/dashboard/admin/documents")
              }
            />

            <DashboardCard
              title="No-Dues"
              description="Manage digital clearance and no-dues workflow."
              href="/dashboard/admin/no-dues"
              icon="✅"
              iconBg="bg-teal-500/10"
              iconColor="text-teal-400"
              onClick={() =>
                router.push("/dashboard/admin/no-dues")
              }
            />

            <DashboardCard
              title="Hostel"
              description="Manage hostel operations and out-pass system."
              href="/dashboard/admin/hostel"
              icon="🏠"
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-400"
              onClick={() =>
                router.push("/dashboard/admin/hostel")
              }
            />

            <DashboardCard
              title="Reports"
              description="View ERP reports, insights and analytics."
              href="/dashboard/admin/reports"
              icon="📊"
              iconBg="bg-yellow-500/10"
              iconColor="text-yellow-400"
              onClick={() =>
                router.push("/dashboard/admin/reports")
              }
            />

            <DashboardCard
              title="Audit Logs"
              description="Track important system activities and events."
              href="/dashboard/admin/audit-logs"
              icon="🔐"
              iconBg="bg-red-500/10"
              iconColor="text-red-400"
              onClick={() =>
                router.push("/dashboard/admin/audit-logs")
              }
            />

          </div>
        </section>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          Campus ERP Administration Portal • Secure Management System
        </footer>

      </div>
    </main>
  );
}

/* ================================================== */
/* QUICK STAT */
/* ================================================== */

function QuickStat({
  icon,
  title,
  value,
  description,
  href,
}: {
  icon: string;
  title: string;
  value: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl transition group-hover:scale-110">
          {icon}
        </div>

      </div>

      <div className="mt-4 text-xs font-semibold text-blue-400">
        Open module →
      </div>
    </Link>
  );
}

/* ================================================== */
/* ACCOUNT ITEM */
/* ================================================== */

function AccountItem({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm">
          {icon}
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 truncate text-sm font-semibold ${highlight
            ? "text-blue-400"
            : "text-slate-200"
          }`}
      >
        {value}
      </p>

    </div>
  );
}

/* ================================================== */
/* DASHBOARD CARD */
/* ================================================== */

function DashboardCard({
  title,
  description,
  icon,
  iconBg,
  iconColor,
  onClick,
}: DashboardCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition duration-300 hover:-translate-y-1.5 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-950/30">

      {/* Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition group-hover:bg-blue-500/10" />

      <div className="relative">

        {/* Icon */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} text-2xl ${iconColor} transition duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        {/* Content */}
        <h4 className="mt-5 text-lg font-bold text-white">
          {title}
        </h4>

        <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-400">
          {description}
        </p>

        {/* Action */}
        <button
          type="button"
          onClick={onClick}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition group-hover:text-blue-300"
        >
          Open Module
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </button>

      </div>
    </div>
  );
}