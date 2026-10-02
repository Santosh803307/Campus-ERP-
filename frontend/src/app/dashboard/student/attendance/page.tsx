"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import api from "@/lib/api";

interface AttendanceSummaryItem {
  subject: string;
  subject_code: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface AttendanceSummaryResponse {
  data: AttendanceSummaryItem[];
  overall: {
    present: number;
    total: number;
    percentage: number;
  };
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  subject: string;
  subject_code: string;
  date: string;
  status: string;
  created_at?: string;
}

export default function AttendancePage() {
  const [summary, setSummary] =
    useState<AttendanceSummaryResponse | null>(null);

  const [history, setHistory] =
    useState<AttendanceRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const [summaryResponse, historyResponse] =
          await Promise.all([
            api.get<AttendanceSummaryResponse>(
              "/api/attendance/me/summary"
            ),

            api.get<AttendanceRecord[]>(
              "/api/attendance/me"
            ),
          ]);

        setSummary(summaryResponse.data);

        /*
         * Backend may return either:
         *   [...]
         * or
         *   { data: [...] }
         */
        const historyData = Array.isArray(
          historyResponse.data
        )
          ? historyResponse.data
          : (
              historyResponse.data as {
                data?: AttendanceRecord[];
              }
            ).data || [];

        setHistory(historyData);
      } catch (err) {
        console.error(
          "Failed to load attendance:",
          err
        );

        setError(
          "Unable to load attendance data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const subjects = summary?.data || [];

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const matchesSubject =
        subjectFilter === "all" ||
        record.subject_code === subjectFilter;

      const matchesStatus =
        statusFilter === "all" ||
        record.status.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSubject && matchesStatus;
    });
  }, [
    history,
    subjectFilter,
    statusFilter,
  ]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getPercentageClass(
    percentage: number
  ) {
    if (percentage < 75) {
      return "text-yellow-400";
    }

    return "text-emerald-400";
  }

  function getProgressClass(
    percentage: number
  ) {
    if (percentage < 75) {
      return "bg-yellow-400";
    }

    return "bg-emerald-500";
  }

  function getStatusClass(status: string) {
    if (
      status.toLowerCase() ===
      "present"
    ) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    }

    return "border-red-500/30 bg-red-500/10 text-red-400";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

              <p className="mt-4 text-sm text-slate-400">
                Loading attendance...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Attendance
              </h1>
            </div>

            <Link
              href="/dashboard/student"
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
            {error}
          </div>
        </div>
      </main>
    );
  }

  const overallPercentage =
    summary?.overall.percentage || 0;

  const totalPresent =
    summary?.overall.present || 0;

  const totalClasses =
    summary?.overall.total || 0;

  const totalAbsent =
    totalClasses - totalPresent;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Attendance
            </h1>

            <p className="mt-3 text-base text-slate-400">
              View your subject-wise attendance and
              overall attendance percentage.
            </p>
          </div>

          <Link
            href="/dashboard/student"
            className="w-fit rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
          >
            ← Dashboard
          </Link>
        </div>

        {/* =====================================================
            OVERALL SUMMARY
        ===================================================== */}

        <section className="mt-8 grid gap-5 lg:grid-cols-3">

          {/* Overall Attendance */}

          <div className="rounded-3xl border border-blue-500/30 bg-slate-950 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Overall Attendance
                </p>

                <div
                  className={`mt-3 text-5xl font-bold ${getPercentageClass(
                    overallPercentage
                  )}`}
                >
                  {overallPercentage.toFixed(2)}%
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-right">
                <p className="text-xs text-slate-500">
                  Classes
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {totalClasses}
                </p>
              </div>
            </div>

            {/* Progress */}

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getProgressClass(
                  overallPercentage
                )}`}
                style={{
                  width: `${Math.min(
                    overallPercentage,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <span className="text-emerald-400">
                Present{" "}
                <strong>
                  {totalPresent}
                </strong>
              </span>

              <span className="text-red-400">
                Absent{" "}
                <strong>
                  {totalAbsent}
                </strong>
              </span>

              <span className="text-slate-400">
                Total{" "}
                <strong className="text-white">
                  {totalClasses}
                </strong>
              </span>
            </div>
          </div>

          {/* Subjects */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-medium text-slate-400">
              Subjects
            </p>

            <p className="mt-3 text-5xl font-bold text-white">
              {subjects.length}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Subjects with attendance records
            </p>
          </div>
        </section>

        {/* =====================================================
            SUBJECT-WISE ATTENDANCE
        ===================================================== */}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-bold">
              Subject-wise Attendance
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Track attendance for every subject.
            </p>
          </div>

          {subjects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
              <div className="text-4xl">
                📚
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No attendance records
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Attendance records will appear
                here once they are added.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {subjects.map((item) => (
                <div
                  key={item.subject_code}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {item.subject}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.subject_code}
                      </p>
                    </div>

                    <span
                      className={`text-2xl font-bold ${getPercentageClass(
                        item.percentage
                      )}`}
                    >
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress */}

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${getProgressClass(
                        item.percentage
                      )}`}
                      style={{
                        width: `${Math.min(
                          item.percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Stats */}

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">
                        Present
                      </p>

                      <p className="mt-1 font-semibold text-emerald-400">
                        {item.present}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Absent
                      </p>

                      <p className="mt-1 font-semibold text-red-400">
                        {item.absent}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-500">
                        Total
                      </p>

                      <p className="mt-1 font-semibold text-slate-300">
                        {item.total}
                      </p>
                    </div>
                  </div>

                  {item.percentage < 75 && (
                    <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
                      ⚠️ Attendance below 75%
                    </div>
                  )}
                </div>
              ))}

            </div>
          )}
        </section>

        {/* =====================================================
            ATTENDANCE HISTORY
        ===================================================== */}

        <section className="mt-12">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Attendance History
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                View your complete class attendance history.
              </p>
            </div>

            {/* Filters */}

            <div className="flex flex-wrap gap-3">

              {/* Subject Filter */}

              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
              >
                <option value="all">
                  All Subjects
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.subject_code}
                    value={subject.subject_code}
                  >
                    {subject.subject}
                  </option>
                ))}
              </select>

              {/* Status Filter */}

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
              >
                <option value="all">
                  All Status
                </option>

                <option value="present">
                  Present
                </option>

                <option value="absent">
                  Absent
                </option>
              </select>

            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl">
                  📋
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  No attendance history
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No records match the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px]">

                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Code
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHistory.map(
                      (record) => (
                        <tr
                          key={record.id}
                          className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-300">
                            {formatDate(
                              record.date
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-white">
                              {record.subject}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {record.subject_code}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                record.status
                              )}`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            )}

          </div>

          {filteredHistory.length > 0 && (
            <p className="mt-3 text-right text-xs text-slate-500">
              Showing{" "}
              {filteredHistory.length}{" "}
              attendance records
            </p>
          )}

        </section>

        {/* =====================================================
            LOW ATTENDANCE WARNING
        ===================================================== */}

        {subjects.some(
          (item) => item.percentage < 75
        ) && (
          <section className="mt-10 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

            <div className="flex gap-4">
              <div className="text-2xl">
                ⚠️
              </div>

              <div>
                <h3 className="font-bold text-yellow-400">
                  Attendance Reminder
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Your attendance is below 75% in
                  one or more subjects. Maintain the
                  minimum attendance requirement set
                  by your college.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {subjects
                    .filter(
                      (item) =>
                        item.percentage < 75
                    )
                    .map((item) => (
                      <span
                        key={item.subject_code}
                        className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400"
                      >
                        {item.subject_code}{" "}
                        {item.percentage.toFixed(1)}%
                      </span>
                    ))}
                </div>
              </div>
            </div>

          </section>
        )}

      </div>
    </main>
  );
}