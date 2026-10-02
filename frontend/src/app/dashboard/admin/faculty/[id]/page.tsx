"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface Faculty {
  id: number;
  user_id: number;
  department_id: number;
  employee_id: string;
  designation: string;
  qualification: string | null;
  specialization: string | null;
  phone: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

export default function FacultyDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const facultyId = Number(params.id);

  const [faculty, setFaculty] =
    useState<Faculty | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadFaculty() {
      try {
        setLoading(true);
        setError("");

        if (
          !facultyId ||
          Number.isNaN(facultyId)
        ) {
          setError("Invalid faculty ID.");
          return;
        }

        const response =
          await api.get<Faculty>(
            `/api/faculty/${facultyId}`
          );

        setFaculty(response.data);
      } catch (err: any) {
        console.error(
          "Faculty details error:",
          err
        );

        if (
          err?.response?.status === 401
        ) {
          setError(
            "Session expired. Please login again."
          );
        } else if (
          err?.response?.status === 403
        ) {
          setError(
            "You do not have permission to view this faculty."
          );
        } else if (
          err?.response?.status === 404
        ) {
          setError(
            "Faculty not found."
          );
        } else {
          setError(
            "Unable to load faculty details."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadFaculty();
  }, [facultyId]);

  if (loading) {
    return (
      <AuthGuard
        allowedRoles={[
          "admin",
          "faculty",
          "hod",
        ]}
      >
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6">
            <p className="text-slate-400">
              Loading faculty details...
            </p>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !faculty) {
    return (
      <AuthGuard
        allowedRoles={[
          "admin",
          "faculty",
          "hod",
        ]}
      >
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-5xl">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/faculty"
                )
              }
              className="mb-6 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              ← Back to Faculty
            </button>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
              <h1 className="text-xl font-semibold text-red-400">
                Faculty Error
              </h1>

              <p className="mt-2 text-slate-300">
                {error ||
                  "Faculty not found."}
              </p>
            </div>

          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard
      allowedRoles={[
        "admin",
        "faculty",
        "hod",
      ]}
    >
      <main className="min-h-screen bg-slate-950 text-white">

        {/* HEADER */}

        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Faculty Profile
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/faculty"
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
            >
              ← Back
            </button>

          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-5xl px-6 py-8">

          {/* PROFILE HEADER */}

          <section className="mb-6 rounded-2xl border border-blue-500/20 bg-slate-900 p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-4xl">
                👨‍🏫
              </div>

              <div className="flex-1">

                <h2 className="text-2xl font-bold">
                  Faculty #{faculty.id}
                </h2>

                <p className="mt-1 text-slate-400">
                  {faculty.employee_id}
                </p>

                <p className="mt-1 text-slate-400">
                  {faculty.designation}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    faculty.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {faculty.is_active
                    ? "ACTIVE"
                    : "INACTIVE"}
                </span>

              </div>

            </div>

          </section>

          {/* PROFESSIONAL INFORMATION */}

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="mb-6 text-xl font-semibold">
              Professional Information
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              <InfoCard
                label="Employee ID"
                value={faculty.employee_id}
              />

              <InfoCard
                label="Designation"
                value={faculty.designation}
              />

              <InfoCard
                label="Department ID"
                value={String(
                  faculty.department_id
                )}
              />

              <InfoCard
                label="Qualification"
                value={
                  faculty.qualification ||
                  "Not provided"
                }
              />

              <InfoCard
                label="Specialization"
                value={
                  faculty.specialization ||
                  "Not provided"
                }
              />

              <InfoCard
                label="Joining Date"
                value={
                  faculty.joining_date
                    ? new Date(
                        faculty.joining_date
                      ).toLocaleDateString()
                    : "Not provided"
                }
              />

            </div>

          </section>

          {/* CONTACT INFORMATION */}

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="mb-6 text-xl font-semibold">
              Contact Information
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoCard
                label="Phone"
                value={
                  faculty.phone ||
                  "Not provided"
                }
              />

              <InfoCard
                label="User ID"
                value={String(
                  faculty.user_id
                )}
              />

            </div>

          </section>

          {/* SYSTEM INFORMATION */}

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="mb-6 text-xl font-semibold">
              System Information
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoCard
                label="Faculty ID"
                value={String(
                  faculty.id
                )}
              />

              <InfoCard
                label="Account Status"
                value={
                  faculty.is_active
                    ? "Active"
                    : "Inactive"
                }
              />

              <InfoCard
                label="Created At"
                value={new Date(
                  faculty.created_at
                ).toLocaleString()}
              />

            </div>

          </section>

          {/* ACTIONS */}

          <section className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/faculty/${faculty.id}/edit`
                )
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
            >
              Edit Faculty
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/faculty"
                )
              }
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-800"
            >
              Back to Faculty
            </button>

          </section>

        </div>

      </main>
    </AuthGuard>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-white">
        {value}
      </p>
    </div>
  );
}