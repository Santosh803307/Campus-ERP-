"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import {
  Department,
  getDepartments,
} from "@/services/departmentService";

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

export default function EditFacultyPage() {
  const params = useParams();
  const router = useRouter();

  const facultyId = Number(params.id);

  const [faculty, setFaculty] =
    useState<Faculty | null>(null);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================
  // FORM STATES
  // =========================

  const [departmentId, setDepartmentId] =
    useState("");

  const [employeeId, setEmployeeId] =
    useState("");

  const [designation, setDesignation] =
    useState("");

  const [qualification, setQualification] =
    useState("");

  const [specialization, setSpecialization] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [joiningDate, setJoiningDate] =
    useState("");

  const [isActive, setIsActive] =
    useState(true);

  // =========================
  // LOAD FACULTY + DEPARTMENTS
  // =========================

  useEffect(() => {
    if (
      !facultyId ||
      Number.isNaN(facultyId)
    ) {
      setError("Invalid faculty ID.");
      setLoading(false);
      return;
    }

    loadData();
  }, [facultyId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        facultyResponse,
        departmentData,
      ] = await Promise.all([
        api.get<Faculty>(
          `/api/faculty/${facultyId}`
        ),
        getDepartments(),
      ]);

      const data =
        facultyResponse.data;

      setFaculty(data);
      setDepartments(departmentData.data);

      setDepartmentId(
        String(data.department_id)
      );

      setEmployeeId(
        data.employee_id
      );

      setDesignation(
        data.designation
      );

      setQualification(
        data.qualification ?? ""
      );

      setSpecialization(
        data.specialization ?? ""
      );

      setPhone(
        data.phone ?? ""
      );

      setJoiningDate(
        data.joining_date
          ? data.joining_date.slice(0, 10)
          : ""
      );

      setIsActive(
        data.is_active
      );
    } catch (err: any) {
      console.error(
        "Failed to load faculty:",
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
          "You are not authorized to edit faculty."
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

  // =========================
  // UPDATE FACULTY
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!departmentId) {
      setError(
        "Please select a department."
      );
      return;
    }

    if (!employeeId.trim()) {
      setError(
        "Employee ID is required."
      );
      return;
    }

    if (!designation.trim()) {
      setError(
        "Designation is required."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        department_id:
          Number(departmentId),

        employee_id:
          employeeId.trim(),

        designation:
          designation.trim(),

        qualification:
          qualification.trim() || null,

        specialization:
          specialization.trim() || null,

        phone:
          phone.trim() || null,

        joining_date:
          joiningDate
            ? joiningDate
            : null,

        is_active:
          isActive,
      };

      const response =
        await api.patch<Faculty>(
          `/api/faculty/${facultyId}`,
          payload
        );

      setFaculty(response.data);

      setSuccess(
        "Faculty updated successfully."
      );

      setTimeout(() => {
        router.push(
          `/dashboard/admin/faculty/${facultyId}`
        );
      }, 800);
    } catch (err: any) {
      console.error(
        "Failed to update faculty:",
        err
      );

      if (
        err?.response?.status === 400
      ) {
        setError(
          err?.response?.data?.detail ||
            "Invalid faculty data."
        );
      } else if (
        err?.response?.status === 401
      ) {
        setError(
          "Session expired. Please login again."
        );
      } else if (
        err?.response?.status === 403
      ) {
        setError(
          "You are not authorized to update this faculty."
        );
      } else if (
        err?.response?.status === 404
      ) {
        setError(
          "Faculty not found."
        );
      } else {
        setError(
          err?.response?.data?.detail ||
            "Unable to update faculty."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // LOADING
  // =========================

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
              Loading faculty...
            </p>
          </div>
        </main>
      </AuthGuard>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (!faculty) {
    return (
      <AuthGuard
        allowedRoles={[
          "admin",
          "faculty",
          "hod",
        ]}
      >
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-4xl">

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
              <h1 className="text-xl font-semibold text-red-400">
                Faculty Error
              </h1>

              <p className="mt-2 text-slate-300">
                {error ||
                  "Faculty not found."}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/admin/faculty"
                  )
                }
                className="mt-5 rounded-lg border border-slate-700 px-5 py-2.5 transition hover:bg-slate-800"
              >
                ← Back to Faculty
              </button>

            </div>

          </div>
        </main>
      </AuthGuard>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <AuthGuard
      allowedRoles={[
        "admin",
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
                Edit Faculty
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/faculty/${facultyId}`
                )
              }
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
            >
              ← Back
            </button>

          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-5xl px-6 py-8">

          {/* TITLE */}

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Edit Faculty Profile
            </h2>

            <p className="mt-2 text-slate-400">
              Update faculty academic and
              professional information.
            </p>
          </div>

          {/* FACULTY IDENTIFICATION */}

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="mb-5 text-xl font-semibold">
              Faculty Information
            </h3>

            <div className="grid gap-5 sm:grid-cols-3">

              <InfoItem
                label="Faculty ID"
                value={`#${faculty.id}`}
              />

              <InfoItem
                label="User ID"
                value={`#${faculty.user_id}`}
              />

              <div>
                <p className="text-sm text-slate-400">
                  Current Status
                </p>

                <p
                  className={
                    isActive
                      ? "mt-1 font-medium text-green-400"
                      : "mt-1 font-medium text-red-400"
                  }
                >
                  {isActive
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>

            </div>

          </section>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-xl border border-green-800 bg-green-950/40 p-4 text-green-300">
              {success}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            {/* ACCOUNT & DEPARTMENT */}

            <h3 className="mb-6 text-xl font-semibold">
              Account & Department
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* EMPLOYEE ID */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) =>
                    setEmployeeId(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* DEPARTMENT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <select
                  value={departmentId}
                  onChange={(e) =>
                    setDepartmentId(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name} (
                        {department.code})
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>

            {/* PROFESSIONAL */}

            <h3 className="mb-6 mt-10 text-xl font-semibold">
              Professional Information
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* DESIGNATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Designation
                </label>

                <input
                  type="text"
                  value={designation}
                  onChange={(e) =>
                    setDesignation(
                      e.target.value
                    )
                  }
                  required
                  placeholder="Assistant Professor"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* QUALIFICATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Qualification
                </label>

                <input
                  type="text"
                  value={qualification}
                  onChange={(e) =>
                    setQualification(
                      e.target.value
                    )
                  }
                  placeholder="M.Tech Computer Science"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* SPECIALIZATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Specialization
                </label>

                <input
                  type="text"
                  value={specialization}
                  onChange={(e) =>
                    setSpecialization(
                      e.target.value
                    )
                  }
                  placeholder="Artificial Intelligence"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* JOINING DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Joining Date
                </label>

                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) =>
                    setJoiningDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Faculty Status
                </label>

                <select
                  value={
                    isActive
                      ? "active"
                      : "inactive"
                  }
                  onChange={(e) =>
                    setIsActive(
                      e.target.value ===
                        "active"
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/admin/faculty/${facultyId}`
                  )
                }
                disabled={saving}
                className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </main>
    </AuthGuard>
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