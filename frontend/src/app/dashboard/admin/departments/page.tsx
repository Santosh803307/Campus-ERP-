"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  Department,
} from "@/services/departmentService";

export default function DepartmentsPage() {
  const router = useRouter();

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DEPARTMENTS
  // =====================================================

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");

      const response = await getDepartments({
        search: search.trim() || undefined,
        is_active:
          statusFilter === "all"
            ? undefined
            : statusFilter === "active",
        page,
        limit,
      });

      setDepartments(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      console.error(error);

      if (error?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      if (error?.response?.status === 403) {
        setError(
          "You do not have permission to access departments."
        );
        return;
      }

      setError(
        error?.response?.data?.detail ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD WHEN FILTER/PAGE CHANGES
  // =====================================================

  useEffect(() => {
    loadDepartments();
  }, [page, limit, statusFilter, search]);

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");
    setEditingId(null);
  }

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        await updateDepartment(editingId, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });

        setSuccess(
          "Department updated successfully."
        );
      } else {
        await createDepartment({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        });

        setSuccess(
          "Department created successfully."
        );
      }

      resetForm();

      await loadDepartments();
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.detail ||
          "Something went wrong."
      );
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteDepartment(id);

      setSuccess(
        "Department deleted successfully."
      );

      // If last item on current page is deleted,
      // move back one page.
      if (
        departments.length === 1 &&
        page > 1
      ) {
        setPage((current) => current - 1);
      } else {
        await loadDepartments();
      }
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.detail ||
          "Failed to delete department."
      );
    }
  }

  // =====================================================
  // EDIT
  // =====================================================

  function handleEdit(department: Department) {
    setEditingId(department.id);

    setName(department.name);
    setCode(department.code);
    setDescription(
      department.description || ""
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Department Management
            </h1>

            <p className="mt-2 text-slate-400">
              Create, update and manage college departments.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/admin")
            }
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-400">
            {success}
          </div>
        )}

        {/* ================================================= */}
        {/* CREATE / EDIT FORM */}
        {/* ================================================= */}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">
            {editingId !== null
              ? "Edit Department"
              : "Create Department"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-3"
          >
            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Department Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Computer Science & Engineering"
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* CODE */}

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Department Code
              </label>

              <input
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="CSE"
                required
                minLength={2}
                maxLength={20}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 uppercase outline-none focus:border-blue-500"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Description
              </label>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Department description"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-3 md:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
              >
                {editingId !== null
                  ? "Update Department"
                  : "Create Department"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 px-5 py-3 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ================================================= */}
        {/* SEARCH & FILTER */}
        {/* ================================================= */}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-5 md:grid-cols-3">

            {/* SEARCH */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search Departments
              </label>

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, code..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                  );

                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="all">
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

            {/* RESET */}

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* DEPARTMENT LIST */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          {/* LIST HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Department Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} department
                {total !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={loadDepartments}
              disabled={loading}
              className="rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>

          {/* TABLE */}

          {loading ? (
            <div className="p-6 text-slate-400">
              Loading departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">
                No departments found.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-left text-sm text-slate-400">
                      <th className="px-6 py-4">
                        ID
                      </th>

                      <th className="px-6 py-4">
                        Name
                      </th>

                      <th className="px-6 py-4">
                        Code
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {departments.map(
                      (department) => (
                        <tr
                          key={department.id}
                          className="border-b border-slate-800 transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4 text-slate-400">
                            #{department.id}
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold">
                              {department.name}
                            </div>

                            {department.description && (
                              <div className="mt-1 max-w-md truncate text-sm text-slate-500">
                                {department.description}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                              {department.code}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={
                                department.is_active
                                  ? "rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400"
                                  : "rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400"
                              }
                            >
                              {department.is_active
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/departments/${department.id}`
                                  )
                                }
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium transition hover:bg-slate-800"
                              >
                                View
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/departments/${department.id}/edit`
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
                              >
                                Edit
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    department.id
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium transition hover:bg-red-500"
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

              {/* ================================================= */}
              {/* PAGINATION */}
              {/* ================================================= */}

              <div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-400">
                  Page{" "}
                  <span className="font-semibold text-white">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {totalPages || 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                      )
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold">
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
                  onChange={(event) => {
                    setLimit(
                      Number(
                        event.target.value
                      )
                    );
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            </>
          )}
        </section>
      </div>
    </main>
  );
}