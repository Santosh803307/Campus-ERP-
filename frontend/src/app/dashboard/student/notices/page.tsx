"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getMyNotices,
  Notice,
} from "@/services/noticeService";

type NoticeCategory =
  | "academic"
  | "examination"
  | "event"
  | "general";

function formatCategory(category: string) {
  return (
    category.charAt(0).toUpperCase() +
    category.slice(1).toLowerCase()
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "examination":
      return "📝";

    case "academic":
      return "🎓";

    case "event":
      return "🎉";

    case "general":
      return "📢";

    default:
      return "📢";
  }
}

function getCategoryStyle(category: string) {
  switch (category.toLowerCase()) {
    case "examination":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    case "academic":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";

    case "event":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "general":
      return "border-slate-700 bg-slate-950 text-slate-400";

    default:
      return "border-slate-700 bg-slate-950 text-slate-400";
  }
}

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    async function loadNotices() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyNotices();

        setNotices(response.data);
      } catch (error) {
        console.error(
          "Failed to load notices:",
          error
        );

        setError(
          "Unable to load college notices. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotices();
  }, []);

  const importantCount = useMemo(() => {
    return notices.filter(
      (notice) =>
        notice.priority.toLowerCase() === "important"
    ).length;
  }, [notices]);

  const eventCount = useMemo(() => {
    return notices.filter(
      (notice) =>
        notice.category.toLowerCase() === "event"
    ).length;
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return notices.filter((notice) => {
      const matchesSearch =
        !searchText ||
        notice.title
          .toLowerCase()
          .includes(searchText) ||
        notice.description
          .toLowerCase()
          .includes(searchText) ||
        notice.department
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "all" ||
        notice.category.toLowerCase() ===
          category.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [notices, search, category]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard/student"
            className="text-slate-500 transition hover:text-white"
          >
            Student Dashboard
          </Link>

          <span className="text-slate-700">
            /
          </span>

          <span className="text-slate-300">
            College Notices
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400">
                📢 College Communication
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                College Notices
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Stay updated with college announcements,
                events and important notices.
              </p>
            </div>

            <Link
              href="/dashboard/student"
              className="inline-flex w-fit items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                />
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900"
                />
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl">
                ⚠️
              </div>

              <div>
                <h2 className="font-semibold text-red-400">
                  Unable to load notices
                </h2>

                <p className="mt-1 text-sm text-red-300/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">

              {/* Total */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Total Notices
                    </p>

                    <p className="mt-2 text-3xl font-bold text-white">
                      {notices.length}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                    📢
                  </div>
                </div>
              </div>

              {/* Important */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Important
                    </p>

                    <p className="mt-2 text-3xl font-bold text-orange-400">
                      {importantCount}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                    ⚠️
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Events
                    </p>

                    <p className="mt-2 text-3xl font-bold text-purple-400">
                      {eventCount}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                    🎉
                  </div>
                </div>
              </div>

            </div>

            {/* Filters */}
            <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="grid gap-5 md:grid-cols-[1fr_200px]">

                {/* Search */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Search notices
                  </label>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by title, department or description..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="all">
                      All Categories
                    </option>

                    <option value="academic">
                      Academic
                    </option>

                    <option value="examination">
                      Examination
                    </option>

                    <option value="event">
                      Event
                    </option>

                    <option value="general">
                      General
                    </option>
                  </select>
                </div>

              </div>
            </div>

            {/* Notices Header */}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">
                Latest Notices
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredNotices.length}{" "}
                {filteredNotices.length === 1
                  ? "notice"
                  : "notices"}{" "}
                found
              </p>
            </div>

            {/* Empty */}
            {filteredNotices.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
                <div className="text-4xl">
                  🔍
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">
                  No notices found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search or category
                  filter.
                </p>
              </div>
            )}

            {/* Notices Grid */}
            {filteredNotices.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">

                {filteredNotices.map((notice) => {
                  const isImportant =
                    notice.priority.toLowerCase() ===
                    "important";

                  return (
                    <article
                      key={notice.id}
                      className={`group rounded-3xl border bg-slate-900 p-6 transition hover:-translate-y-1 hover:bg-slate-900/90 ${
                        isImportant
                          ? "border-purple-500/40"
                          : "border-slate-800"
                      }`}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                          {getCategoryIcon(
                            notice.category
                          )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getCategoryStyle(
                              notice.category
                            )}`}
                          >
                            {formatCategory(
                              notice.category
                            )}
                          </span>

                          {isImportant && (
                            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                              Important
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="mt-6 text-xl font-bold leading-7 text-white">
                        {notice.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {notice.description}
                      </p>

                      {/* Divider */}
                      <div className="my-6 border-t border-slate-800" />

                      {/* Meta */}
                      <div className="grid gap-4 sm:grid-cols-2">

                        <div>
                          <p className="text-xs text-slate-500">
                            Published
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-300">
                            {formatDate(
                              notice.published_at
                            )}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs text-slate-500">
                            Department
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-300">
                            {notice.department}
                          </p>
                        </div>

                      </div>
                    </article>
                  );
                })}

              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}