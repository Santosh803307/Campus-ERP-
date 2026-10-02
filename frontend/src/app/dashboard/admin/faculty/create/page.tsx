"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import { createFaculty } from "@/services/facultyService";
import { getDepartments, Department } from "@/services/departmentService";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function CreateFacultyPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [userId, setUserId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [usersResponse, departmentsData] =
          await Promise.all([
            api.get<User[]>("/api/users/"),
            getDepartments(),
          ]);

        setUsers(
          usersResponse.data.filter(
            (user) =>
              user.role.toLowerCase() === "faculty" &&
              user.is_active
          )
        );

        setDepartments(
          departmentsData.data.filter(
            (department) => department.is_active
          )
        );
      } catch (err: any) {
        console.error(
          "Failed to load faculty form data:",
          err
        );

        if (err?.response?.status === 401) {
          setError(
            "Session expired. Please login again."
          );
        } else if (err?.response?.status === 403) {
          setError(
            "You are not authorized to create faculty."
          );
        } else {
          setError(
            "Unable to load required data."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!userId) {
      setError("Please select a faculty user.");
      return;
    }

    if (!departmentId) {
      setError("Please select a department.");
      return;
    }

    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }

    if (!designation.trim()) {
      setError("Designation is required.");
      return;
    }

    try {
      setSaving(true);

      await createFaculty({
        user_id: Number(userId),
        department_id: Number(departmentId),
        employee_id: employeeId.trim(),
        designation: designation.trim(),
        qualification:
          qualification.trim() || undefined,
        specialization:
          specialization.trim() || undefined,
        phone: phone.trim() || undefined,
        joining_date: joiningDate
          ? `${joiningDate}T00:00:00`
          : undefined,
      });

      router.push(
        "/dashboard/admin/faculty"
      );
    } catch (err: any) {
      console.error(
        "Failed to create faculty:",
        err
      );

      if (err?.response?.status === 400) {
        setError(
          err?.response?.data?.detail ||
            "Invalid faculty data."
        );
      } else if (err?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (err?.response?.status === 403) {
        setError(
          "You are not authorized to create faculty."
        );
      } else {
        setError(
          "Unable to create faculty."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard
        allowedRoles={["admin", "hod"]}
      >
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p className="text-slate-400">
            Loading faculty form...
          </p>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard
      allowedRoles={["admin"]}
    >
      <main className="min-h-screen bg-slate-950 text-white">

        {/* HEADER */}

        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

            <div>
              <p className="text-sm font-semibold text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Add Faculty
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/faculty"
                )
              }
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-800"
            >
              ← Faculty
            </button>

          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-5xl px-6 py-8">

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Create Faculty Profile
            </h2>

            <p className="mt-2 text-slate-400">
              Assign an existing faculty user to a
              department and create their faculty
              profile.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            {/* ACCOUNT */}

            <h3 className="mb-6 text-xl font-semibold">
              Account & Department
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* USER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Faculty User
                </label>

                <select
                  value={userId}
                  onChange={(event) =>
                    setUserId(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select Faculty User
                  </option>

                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.full_name} —{" "}
                      {user.email}
                    </option>
                  ))}
                </select>

                {users.length === 0 && (
                  <p className="mt-2 text-xs text-yellow-400">
                    No faculty users available.
                    Create a user with role
                    &quot;faculty&quot; first.
                  </p>
                )}
              </div>

              {/* DEPARTMENT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <select
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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

              {/* EMPLOYEE ID */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value
                    )
                  }
                  placeholder="Example: FAC2026002"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* DESIGNATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Designation
                </label>

                <input
                  type="text"
                  value={designation}
                  onChange={(event) =>
                    setDesignation(
                      event.target.value
                    )
                  }
                  placeholder="Assistant Professor"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
                  onChange={(event) =>
                    setQualification(
                      event.target.value
                    )
                  }
                  placeholder="M.Tech Computer Science"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
                  onChange={(event) =>
                    setSpecialization(
                      event.target.value
                    )
                  }
                  placeholder="Artificial Intelligence"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
                  onChange={(event) =>
                    setJoiningDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/admin/faculty"
                  )
                }
                disabled={saving}
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving || users.length === 0
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Faculty"}
              </button>

            </div>

          </form>
        </div>
      </main>
    </AuthGuard>
  );
}