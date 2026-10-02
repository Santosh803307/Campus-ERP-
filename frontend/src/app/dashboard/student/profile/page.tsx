"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface StudentProfile {
  id: number;
  user_id: number;

  full_name: string;
  email: string;

  department_id: number;
  department_name: string;
  department_code: string;

  enrollment_no: string;
  phone: string | null;
  course: string;
  semester: number;
  section: string | null;
  admission_year: number;

  is_active: boolean;
  created_at: string;
}

export default function StudentProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<StudentProfile>(
          "/api/students/me"
        );

      setProfile(response.data);
    } catch (error: any) {
      console.error(
        "Failed to load student profile:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Unable to load student profile."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

            <p className="mt-4 text-sm text-slate-400">
              Loading your profile...
            </p>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:py-8">
        <div className="mx-auto max-w-5xl">

          {/* ========================================= */}
          {/* HEADER */}
          {/* ========================================= */}

          <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                My Profile
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                View your personal and academic information.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/student"
                )
              }
              className="w-fit rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
            >
              ← Dashboard
            </button>
          </header>

          {/* ========================================= */}
          {/* ERROR */}
          {/* ========================================= */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-800 bg-red-950/40 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  ⚠️
                </span>

                <div>
                  <h2 className="font-semibold text-red-300">
                    Unable to load profile
                  </h2>

                  <p className="mt-1 text-sm text-red-400">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={loadProfile}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* PROFILE */}
          {/* ========================================= */}

          {profile && (
            <>
              {/* ===================================== */}
              {/* PROFILE HEADER CARD */}
              {/* ===================================== */}

              <section className="mt-6 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl ring-1 ring-blue-500/20">
                      🎓
                    </div>

                    <div>
                      <p className="text-sm font-medium text-blue-400">
                        Student Profile
                      </p>

                      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {profile.full_name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-fit rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
                    <p className="text-xs text-slate-400">
                      Account Status
                    </p>

                    <p
                      className={`mt-1 flex items-center gap-2 text-sm font-semibold ${
                        profile.is_active
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          profile.is_active
                            ? "bg-emerald-400"
                            : "bg-red-400"
                        }`}
                      />

                      {profile.is_active
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ===================================== */}
              {/* PERSONAL INFORMATION */}
              {/* ===================================== */}

              <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                      👤
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        Personal Information
                      </h2>

                      <p className="text-sm text-slate-500">
                        Your registered personal details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Full Name */}
                  <InfoItem
                    label="Full Name"
                    value={profile.full_name}
                  />

                  {/* Email */}
                  <InfoItem
                    label="Email Address"
                    value={profile.email}
                  />

                  {/* Phone */}
                  <InfoItem
                    label="Phone Number"
                    value={
                      profile.phone ||
                      "Not provided"
                    }
                  />

                  {/* User ID */}
                  <InfoItem
                    label="Student Account ID"
                    value={String(profile.user_id)}
                  />
                </div>
              </section>

              {/* ===================================== */}
              {/* ACADEMIC INFORMATION */}
              {/* ===================================== */}

              <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                      🎓
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        Academic Information
                      </h2>

                      <p className="text-sm text-slate-500">
                        Your current academic details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Enrollment */}
                  <InfoItem
                    label="Enrollment Number"
                    value={
                      profile.enrollment_no
                    }
                  />

                  {/* Department */}
                  <InfoItem
                    label="Department"
                    value={`${profile.department_name} (${profile.department_code})`}
                  />

                  {/* Course */}
                  <InfoItem
                    label="Course"
                    value={profile.course}
                  />

                  {/* Semester */}
                  <InfoItem
                    label="Semester"
                    value={`Semester ${profile.semester}`}
                  />

                  {/* Section */}
                  <InfoItem
                    label="Section"
                    value={
                      profile.section ||
                      "Not assigned"
                    }
                  />

                  {/* Admission Year */}
                  <InfoItem
                    label="Admission Year"
                    value={String(
                      profile.admission_year
                    )}
                  />
                </div>
              </section>

              {/* ===================================== */}
              {/* ACCOUNT INFORMATION */}
              {/* ===================================== */}

              <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                      🔐
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        Account Information
                      </h2>

                      <p className="text-sm text-slate-500">
                        Campus ERP account details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    label="Account ID"
                    value={String(profile.user_id)}
                  />

                  <InfoItem
                    label="Role"
                    value="Student"
                  />

                  <InfoItem
                    label="Student Profile ID"
                    value={String(profile.id)}
                  />

                  <InfoItem
                    label="Profile Created"
                    value={formatDate(
                      profile.created_at
                    )}
                  />
                </div>
              </section>

              {/* ===================================== */}
              {/* NOTE */}
              {/* ===================================== */}

              <section className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                    ℹ️
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-300">
                      Profile Information
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      These details are maintained by the
                      Campus ERP administration. If any
                      information is incorrect, please
                      contact your college administration.
                    </p>
                  </div>
                </div>
              </section>

              {/* ===================================== */}
              {/* BACK BUTTON */}
              {/* ===================================== */}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard/student"
                    )
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

/* ====================================================== */
/* INFO ITEM */
/* ====================================================== */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* ====================================================== */
/* DATE FORMATTER */
/* ====================================================== */

function formatDate(
  dateString: string
): string {
  if (!dateString) {
    return "Not available";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}