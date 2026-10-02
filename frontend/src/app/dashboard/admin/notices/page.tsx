"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createNotice,
  deleteNotice,
  getAllNotices,
  updateNotice,
  Notice,
} from "@/services/noticeService";

interface NoticeForm {
  title: string;
  description: string;
  category: string;
  priority: string;
  department: string;
}

const initialForm: NoticeForm = {
  title: "",
  description: "",
  category: "General",
  priority: "Normal",
  department: "",
};

export default function AdminNoticesPage() {
  const router = useRouter();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] =
    useState<Notice | null>(null);

  const [form, setForm] =
    useState<NoticeForm>(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadNotices() {
    try {
      setLoading(true);
      setError("");

      const response = await getAllNotices();

      setNotices(response.data);
    } catch (err: any) {
      console.error(
        "Failed to load notices:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to load notices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        notices.map(
          (notice) => notice.category
        )
      )
    );
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesSearch =
        !searchValue ||
        notice.title
          .toLowerCase()
          .includes(searchValue) ||
        notice.description
          .toLowerCase()
          .includes(searchValue) ||
        notice.department
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" ||
        notice.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        notice.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPriority
      );
    });
  }, [
    notices,
    search,
    categoryFilter,
    priorityFilter,
  ]);

  function openCreateForm() {
    setEditingNotice(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(notice: Notice) {
    setEditingNotice(notice);

    setForm({
      title: notice.title,
      description: notice.description,
      category: notice.category,
      priority: notice.priority,
      department: notice.department,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingNotice(null);
    setForm(initialForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.department.trim()
    ) {
      setError(
        "Please fill all required fields."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim(),
        category: form.category,
        priority: form.priority,
        department:
          form.department.trim(),
      };

      if (editingNotice) {
        await updateNotice(
          editingNotice.id,
          payload
        );

        setSuccess(
          "Notice updated successfully."
        );
      } else {
        await createNotice(payload);

        setSuccess(
          "Notice created successfully."
        );
      }

      setShowForm(false);
      setEditingNotice(null);
      setForm(initialForm);

      await loadNotices();
    } catch (err: any) {
      console.error(
        "Failed to save notice:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to save notice."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    notice: Notice
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notice.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteNotice(notice.id);

      setSuccess(
        "Notice deleted successfully."
      );

      await loadNotices();
    } catch (err: any) {
      console.error(
        "Failed to delete notice:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to delete notice."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("All");
    setPriorityFilter("All");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-2xl font-bold">
              Notice Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Create and manage college notices.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin"
              )
            }
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-blue-500 hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top section */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              College Notices
            </h2>

            <p className="mt-2 text-slate-400">
              Publish important announcements
              for students and campus departments.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
          >
            + Create Notice
          </button>
        </div>

        {/* Messages */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Create / Edit form */}

        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {editingNotice
                    ? "Edit Notice"
                    : "Create Notice"}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Fill in the notice information
                  below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Notice Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Mid-Term Examination Schedule Released"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="General">
                      General
                    </option>

                    <option value="Academic">
                      Academic
                    </option>

                    <option value="Examination">
                      Examination
                    </option>

                    <option value="Event">
                      Event
                    </option>

                    <option value="Fee">
                      Fee
                    </option>

                    <option value="Hostel">
                      Hostel
                    </option>

                    <option value="Library">
                      Library
                    </option>

                    <option value="Placement">
                      Placement
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="Normal">
                      Normal
                    </option>

                    <option value="Important">
                      Important
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Department / Issuing Authority
                  </label>

                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        department:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Examination Cell"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    rows={5}
                    placeholder="Write the complete notice..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingNotice
                    ? "Update Notice"
                    : "Publish Notice"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filters */}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm text-slate-400">
                Search Notices
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search title, description, department..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Priority
              </label>

              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">
                  All Priorities
                </option>

                <option value="Normal">
                  Normal
                </option>

                <option value="Important">
                  Important
                </option>

                <option value="Urgent">
                  Urgent
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* Notice records */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h3 className="text-xl font-bold">
                Notice Records
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Showing{" "}
                {filteredNotices.length} of{" "}
                {notices.length} notices
              </p>
            </div>

            <button
              type="button"
              onClick={loadNotices}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading notices...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-lg font-semibold">
                No notices found
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Create a notice or change your
                filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredNotices.map(
                (notice) => (
                  <div
                    key={notice.id}
                    className="p-6 transition hover:bg-slate-800/40"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-bold">
                            {notice.title}
                          </h4>

                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                            {notice.category}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              notice.priority
                                .toLowerCase() ===
                              "urgent"
                                ? "bg-red-500/10 text-red-400"
                                : notice.priority
                                    .toLowerCase() ===
                                  "important"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {notice.priority}
                          </span>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {notice.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                          <span>
                            🏢{" "}
                            {notice.department}
                          </span>

                          <span>
                            📅{" "}
                            {new Date(
                              notice.published_at
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              notice
                            )
                          }
                          className="rounded-lg border border-blue-500/50 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/10"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              notice
                            )
                          }
                          className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}