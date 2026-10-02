"use client";

import { useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

import {
  getMyStudentProfile,
  Student,
} from "@/services/studentService";

export default function StudentDashboard() {
  const { logout } = useAuth();

  const [student, setStudent] =
    useState<Student | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(true);

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        const data =
          await getMyStudentProfile();

        setStudent(data);
      } catch (error) {
        console.error(
          "Failed to load student profile:",
          error
        );
      } finally {
        setProfileLoading(false);
      }
    }

    loadStudentProfile();
  }, []);

  return (

    <AuthGuard allowedRoles={["student"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Student Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Manage your academic activities and campus
                services from one place.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />

              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </header>

          {/* ================================================== */}
          {/* WELCOME / PROFILE SUMMARY */}
          {/* ================================================== */}

          <div className="mt-8 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-slate-900 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              {/* Student Info */}
              <div className="flex items-center gap-5">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  🎓
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Welcome back
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    {profileLoading
                      ? "Loading..."
                      : `${student?.full_name || "Student"} 👋`}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {profileLoading
                      ? "Loading student information..."
                      : student
                        ? `${student.course} • Semester ${student.semester}${student.section ? ` • Section ${student.section}` : ""}`
                        : "Student Portal"}
                  </p>

                  {!profileLoading && student && (
                    <p className="mt-1 text-xs text-slate-500">
                      {student.email}
                    </p>
                  )}
                </div>

              </div>

              {/* Account Status + Profile */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
                  <p className="text-xs text-slate-400">
                    Account Status
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-sm font-semibold text-emerald-400">
                      {student?.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/student/profile"
                  className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
                >
                  My Profile →
                </Link>

              </div>

            </div>
          </div>
          {/* ================================================== */}
          {/* QUICK OVERVIEW */}
          {/* ================================================== */}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Quick Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Access your most important campus services quickly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Out Pass */}
              <Link
                href="/dashboard/student/out-pass"
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-slate-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                    🪪
                  </div>

                  <span className="text-xs font-medium text-blue-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-4 font-semibold">
                  Hostel Out-Pass
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Apply and track your out-pass.
                </p>
              </Link>

              {/* Fees */}
              <Link
                href="/dashboard/student/fees"
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-slate-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                    💳
                  </div>

                  <span className="text-xs font-medium text-emerald-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-4 font-semibold">
                  Fees & Payments
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  View fees and payment receipts.
                </p>
              </Link>

              {/* No Dues */}
              <Link
                href="/dashboard/student/no-dues"
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-purple-500/50 hover:bg-slate-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                    📋
                  </div>

                  <span className="text-xs font-medium text-purple-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-4 font-semibold">
                  Digital No-Dues
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Track your clearance process.
                </p>
              </Link>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:-translate-y-1 hover:border-amber-500/50 hover:bg-slate-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-xl">
                    🔔
                  </div>

                  <span className="text-xs font-medium text-amber-400">
                    View
                  </span>
                </div>

                <h3 className="mt-4 font-semibold">
                  Notifications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Check important campus updates.
                </p>
              </button>
            </div>
          </section>

          {/* ================================================== */}
          {/* STUDENT SERVICES */}
          {/* ================================================== */}

          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Student Services
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Academic and campus services available through
                Campus ERP.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* Attendance */}
              <Link
                href="/dashboard/student/attendance"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                    📚
                  </div>

                  <span className="text-sm font-semibold text-emerald-400">
                    Open →
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Attendance
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  View subject-wise attendance and monitor
                  your overall attendance percentage.
                </p>

                <div className="mt-5 text-sm font-semibold text-emerald-400">
                  View Attendance →
                </div>
              </Link>

              {/* Examination */}
              <div className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-orange-500/40 hover:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl">
                    📝
                  </div>

                  <Link
                    href="/dashboard/student/examination"
                    className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 transition hover:border-orange-500/40 hover:bg-orange-500/20 hover:text-orange-300"
                  >
                    Open →
                  </Link>
                </div>

                <h3 className="mt-5 text-lg font-bold text-white">
                  Examination
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  View your examination schedule, dates, timings,
                  examination rooms and results.
                </p>

                {/* Examination Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/student/examination"
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                  >
                    Exam Schedule
                  </Link>

                  <Link
                    href="/dashboard/student/results"
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    Results
                  </Link>
                </div>
              </div>

              {/* College Notices */}
              <Link
                href="/dashboard/student/notices"
                className="group block rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-purple-500/40 hover:bg-slate-900/90"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                    📢
                  </div>

                  <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-white">
                  College Notices
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Stay updated with college announcements, events and
                  important notices.
                </p>

                <div className="mt-5">
                  <span className="text-sm font-semibold text-purple-400 transition group-hover:text-purple-300">
                    View Notices →
                  </span>
                </div>
              </Link>

              {/* Documents */}
              <Link
                href="/dashboard/student/documents"
                className="group block rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900/90"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                    📄
                  </div>

                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-white">
                  Documents
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Access certificates, receipts and other important
                  student documents.
                </p>

                <div className="mt-5">
                  <span className="text-sm font-semibold text-blue-400 transition group-hover:text-blue-300">
                    View Documents →
                  </span>
                </div>
              </Link>
              {/* Academic Profile */}
              <Link
                href="/dashboard/student/profile"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-slate-800/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                    👤
                  </div>

                  <span className="text-sm font-semibold text-blue-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  My Profile
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  View your personal and academic information.
                </p>
              </Link>

              {/* Help & Support */}
              <Link
                href="/dashboard/student/support"
                className="group block rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900/90"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                    💬
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Open →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-white">
                  Help & Support
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Need assistance? Contact the concerned department
                  through Campus ERP.
                </p>

                <div className="mt-5">
                  <span className="text-sm font-semibold text-emerald-400 transition group-hover:text-emerald-300">
                    Get Help →
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* ================================================== */}
          {/* QUICK ACTIONS */}
          {/* ================================================== */}

          <section className="mt-10">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    ⚡ Quick Actions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Frequently used student services.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/student/out-pass"
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
                  >
                    Apply Out-Pass
                  </Link>

                  <Link
                    href="/dashboard/student/fees"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    View Fees
                  </Link>

                  <Link
                    href="/dashboard/student/no-dues"
                    className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-400 transition hover:bg-purple-500/20"
                  >
                    Check No-Dues
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* PORTAL INFORMATION */}
          {/* ================================================== */}

          <section className="mt-8">
            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                  🎓
                </div>

                <div>
                  <h2 className="text-lg font-bold text-blue-300">
                    Student Portal
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Campus ERP provides a centralized platform
                    for managing your academic activities,
                    fees, hostel services, No-Dues and other
                    campus operations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* FOOTER */}
          {/* ================================================== */}

          <footer className="mt-10 border-t border-slate-800 py-6 text-center">
            <p className="text-xs text-slate-600">
              Campus ERP • Student Portal
            </p>
          </footer>

        </div>
      </main>
    </AuthGuard>
  );
}