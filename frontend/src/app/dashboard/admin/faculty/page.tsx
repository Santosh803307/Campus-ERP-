"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import {
  deleteFaculty,
  Faculty,
  getFaculty,
} from "@/services/facultyService";

export default function FacultyPage() {
  const router = useRouter();

  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  async function loadFaculty() {
    try {
      setLoading(true);
      setError("");

      const data = await getFaculty();

      setFaculty(data);
    } catch (error: any) {
      console.error(
        "Failed to load faculty:",
        error
      );

      if (error?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (error?.response?.status === 403) {
        setError(
          "You are not authorized to view faculty."
        );
      } else {
        setError(
          "Unable to load faculty records."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaculty();
  }, []);

  async function handleDelete(
    facultyId: number,
    employeeId: string
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete faculty ${employeeId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFaculty(facultyId);

      setFaculty((current) =>
        current.filter(
          (item) => item.id !== facultyId
        )
      );
    } catch (error: any) {
      console.error(
        "Failed to delete faculty:",
        error
      );

      if (error?.response?.status === 403) {
        alert(
          "You are not authorized to delete faculty."
        );
      } else {
        alert(
          "Unable to delete faculty."
        );
      }
    }
  }

  const filteredFaculty = faculty.filter(
    (item) => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return true;
      }

      return (
        item.employee_id
          .toLowerCase()
          .includes(value) ||
        item.designation
          .toLowerCase()
          .includes(value) ||
        (item.qualification || "")
          .toLowerCase()
          .includes(value) ||
        (item.specialization || "")
          .toLowerCase()
          .includes(value) ||
        String(item.department_id).includes(
          value
        )
      );
    }
  );

  return (
    <AuthGuard
      allowedRoles={["admin", "hod"]}
    >
      <main className="min-h-screen bg-slate-950 text-white">
        {/* HEADER */}

        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Faculty Management
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage faculty members and their
                academic information.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/admin"
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                ← Dashboard
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/admin/faculty/create"
                  )
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Faculty
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* STATS */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/20 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Total Faculty
              </p>

              <p className="mt-2 text-3xl font-bold text-white">
                {faculty.length}
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Active Faculty
              </p>

              <p className="mt-2 text-3xl font-bold text-green-400">
                {
                  faculty.filter(
                    (item) => item.is_active
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">
                Inactive Faculty
              </p>

              <p className="mt-2 text-3xl font-bold text-red-400">
                {
                  faculty.filter(
                    (item) => !item.is_active
                  ).length
                }
              </p>
            </div>
          </div>

          {/* SEARCH */}

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search Faculty
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Employee ID, designation, qualification..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </section>

          {/* FACULTY TABLE */}

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            <div className="flex flex-col gap-2 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Faculty Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredFaculty.length} records
                </p>
              </div>

              <button
                type="button"
                onClick={loadFaculty}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center">
                <p className="text-slate-400">
                  Loading faculty...
                </p>
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-4xl">👨‍🏫</p>

                <h3 className="mt-4 text-lg font-semibold">
                  No Faculty Found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No faculty records match your
                  search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-800 bg-slate-950">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">
                        Faculty
                      </th>

                      <th className="px-6 py-4">
                        Employee ID
                      </th>

                      <th className="px-6 py-4">
                        Department
                      </th>

                      <th className="px-6 py-4">
                        Designation
                      </th>

                      <th className="px-6 py-4">
                        Specialization
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredFaculty.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                                👨‍🏫
                              </div>

                              <div>
                                <p className="font-semibold text-white">
                                  Faculty #
                                  {item.id}
                                </p>

                                <p className="text-sm text-slate-500">
                                  User ID:{" "}
                                  {item.user_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium">
                              {
                                item.employee_id
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            Department{" "}
                            {item.department_id}
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-medium text-white">
                              {item.designation}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {
                                item.qualification ||
                                "Qualification not provided"
                              }
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {item.specialization ||
                              "Not provided"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.is_active
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {item.is_active
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/faculty/${item.id}`
                                  )
                                }
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/faculty/${item.id}/edit`
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item.id,
                                    item.employee_id
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium transition hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}