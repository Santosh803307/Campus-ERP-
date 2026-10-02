"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Student,
  StudentQuery,
  getStudents,
  deleteStudent,
  setStudentStatus,
} from "@/services/studentService";

export default function AdminStudentsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] =
    useState("");

  const [semester, setSemester] =
    useState("");

  const [section, setSection] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<number | null>(null);

  useEffect(() => {
    loadStudents();
  }, [
    page,
    limit,
    search,
    departmentId,
    semester,
    section,
    statusFilter,
  ]);

  async function loadStudents(
    query: StudentQuery = {}
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await getStudents({
        search,
        department_id:
          departmentId
            ? Number(departmentId)
            : undefined,
        semester:
          semester
            ? Number(semester)
            : undefined,
        section:
          section || undefined,
        is_active:
          statusFilter === ""
            ? undefined
            : statusFilter === "active",
        page,
        limit,
        ...query,
      });

      setStudents(response.data);

      setTotal(
        response.pagination.total
      );

      setTotalPages(
        response.pagination.pages
      );
    } catch (error: any) {
      console.error(
        "Failed to load students:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        setError(
          "Session expired. Please login again."
        );
      } else if (
        error?.response?.status === 403
      ) {
        setError(
          "You are not authorized to view students."
        );
      } else {
        setError(
          "Unable to load students."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(
    student: Student
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete student ${student.enrollment_no}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(student.id);

      await deleteStudent(student.id);

      setStudents((current) =>
        current.filter(
          (item) => item.id !== student.id
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete student:",
        error
      );

      alert(
        "Unable to delete student."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(
    student: Student
  ) {
    try {
      setStatusUpdatingId(student.id);

      const updated =
        await setStudentStatus(
          student.id,
          !student.is_active
        );

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? updated
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to update student status:",
        error
      );

      alert(
        "Unable to update student status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-xl font-bold">
              Student Management
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin"
              )
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Students
            </h2>

            <p className="mt-2 text-slate-400">
              Manage student records,
              enrollment and status.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin/students/create"
              )
            }
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
          >
            + Add Student
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Search Students
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, enrollment, course..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-4">

            {/* Department */}
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">
                All Departments
              </option>

              <option value="1">
                CSE
              </option>
              <option value="2">
                CE
              </option>
              <option value="3">
                ME
              </option>
              <option value="4">
                ECE
              </option>
              <option value="5">
                AIML
              </option>
              <option value="6">
                EE
              </option>
            </select>

            {/* Semester */}
            <select
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">
                All Semesters
              </option>

              {Array.from(
                { length: 8 },
                (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                  >
                    Semester {index + 1}
                  </option>
                )
              )}
            </select>

            {/* Section */}
            <input
              type="text"
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                setPage(1);
              }}
              placeholder="Section e.g. A"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

          </div>

          {/* RESET BUTTON */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDepartmentId("");
                setSemester("");
                setSection("");
                setStatusFilter("");
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">
              Loading students...
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            {/* Table header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h3 className="font-semibold">
                  Student Records
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Showing{" "}
                  {students.length}{" "}
                  of {total} students
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadStudents()}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-400">
                  No students found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">

                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold">
                        ID
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Enrollment
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Course
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Semester
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Section
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Admission
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Status
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => (
                        <tr
                          key={student.id}
                          className="border-b border-slate-800 transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4 text-sm">
                            #{student.id}
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-medium">
                              {
                                student.enrollment_no
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              User ID:{" "}
                              {student.user_id}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            {student.course}
                          </td>

                          <td className="px-6 py-4">
                            Semester{" "}
                            {student.semester}
                          </td>

                          <td className="px-6 py-4">
                            {student.section ||
                              "—"}
                          </td>

                          <td className="px-6 py-4">
                            {
                              student.admission_year
                            }
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={
                                student.is_active
                                  ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400"
                                  : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
                              }
                            >
                              {student.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/students/${student.id}`
                                  )
                                }
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs transition hover:bg-slate-800"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/students/${student.id}/edit`
                                  )
                                }
                                className="rounded-lg border border-blue-700 px-3 py-2 text-xs text-blue-400 transition hover:bg-blue-950"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  statusUpdatingId ===
                                  student.id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    student
                                  )
                                }
                                className="rounded-lg border border-yellow-700 px-3 py-2 text-xs text-yellow-400 transition hover:bg-yellow-950 disabled:opacity-50"
                              >
                                {statusUpdatingId ===
                                  student.id
                                  ? "..."
                                  : student.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  student.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    student
                                  )
                                }
                                className="rounded-lg border border-red-700 px-3 py-2 text-xs text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                              >
                                {deletingId ===
                                  student.id
                                  ? "..."
                                  : "Delete"}
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
            <div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-sm text-slate-400">
                Page {page} of {totalPages || 1}
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>

              </div>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(
                    Number(e.target.value)
                  );
                  setPage(1);
                }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value={10}>
                  10 / page
                </option>

                <option value={20}>
                  20 / page
                </option>

                <option value={50}>
                  50 / page
                </option>

                <option value={100}>
                  100 / page
                </option>
              </select>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}