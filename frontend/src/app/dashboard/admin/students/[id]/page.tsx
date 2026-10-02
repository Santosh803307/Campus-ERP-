"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getStudent,
  type Student,
} from "@/services/studentService";



export default function StudentViewPage() {
  const router = useRouter();
  const params = useParams();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = Number(params.id);

  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        if (!studentId || Number.isNaN(studentId)) {
          setError("Invalid student ID");
          return;
        }

        const data = await getStudent(studentId);
        setStudent(data);
      } catch (err) {
        console.error("Failed to load student:", err);
        setError("Failed to load student details.");
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [studentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading student details...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <button
            onClick={() =>
              router.push("/dashboard/admin/students")
            }
            className="mb-6 rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            ← Students
          </button>

          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6">
            <h1 className="text-xl font-semibold text-red-400">
              Error
            </h1>

            <p className="mt-2 text-slate-300">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-xl font-bold">
              Student Profile
            </h1>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard/admin/students")
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Profile Header */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Enrollment Number
              </p>

              <h2 className="text-2xl font-bold">
                {student.full_name}
              </h2>

              <p className="mt-1 text-slate-400">
                {student.email}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {student.enrollment_no}
              </p>
            </div>

            <div>
              {student.is_active ? (
                <span className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
                  ● Active
                </span>
              ) : (
                <span className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
                  ● Inactive
                </span>
              )}
            </div>

          </div>
        </section>

        {/* Academic Information */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-6 text-xl font-semibold">
            Academic Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            <InfoItem
              label="Enrollment Number"
              value={student.enrollment_no}
            />

            <InfoItem
              label="Department"
              value={`${student.department_name} (${student.department_code})`}
            />

            <InfoItem
              label="Course"
              value={student.course}
            />

            <InfoItem
              label="Semester"
              value={`Semester ${student.semester}`}
            />

            <InfoItem
              label="Section"
              value={student.section || "Not provided"}
            />

            <InfoItem
              label="Admission Year"
              value={String(student.admission_year)}
            />

          </div>
        </section>

        {/* Personal Information */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-6 text-xl font-semibold">
            Personal Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">

            <InfoItem
              label="Email"
              value={student.email}
            />

            <InfoItem
              label="Phone"
              value={
                student.phone ||
                "Not provided"
              }
            />

          </div>
        </section>

        {/* System Information */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-6 text-xl font-semibold">
            System Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">

            <InfoItem
              label="Student ID"
              value={String(student.id)}
            />

            <InfoItem
              label="Account Status"
              value={student.is_active ? "Active" : "Inactive"}
            />

            <InfoItem
              label="Created At"
              value={new Date(
                student.created_at
              ).toLocaleString()}
            />

          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap gap-3">

          <button
            onClick={() =>
              router.push(
                `/dashboard/admin/students/${student.id}/edit`
              )
            }
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-700"
          >
            Edit Student
          </button>

          <button
            onClick={() =>
              router.push("/dashboard/admin/students")
            }
            className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium hover:bg-slate-800"
          >
            Back to Students
          </button>

        </section>

      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-white">
        {value}
      </p>
    </div>
  );
}