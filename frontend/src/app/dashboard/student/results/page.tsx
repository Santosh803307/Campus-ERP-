"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AuthGuard from "@/components/AuthGuard";
import { getMyExamResults } from "@/services/examResultService";
import type { StudentExamResult } from "@/services/examResultService";

export default function StudentResultsPage() {
    const [results, setResults] = useState<StudentExamResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadResults() {
            try {
                setLoading(true);
                setError("");

                const response = await getMyExamResults();

                setResults(response);
            } catch (err) {
                console.error("Failed to load exam results:", err);

                setError(
                    "Unable to load your examination results."
                );
            } finally {
                setLoading(false);
            }
        }

        loadResults();
    }, []);

    const summary = useMemo(() => {
        if (results.length === 0) {
            return {
                totalSubjects: 0,
                totalMarks: 0,
                obtainedMarks: 0,
                percentage: 0,
            };
        }

        const totalMarks = results.reduce(
            (sum, result) =>
                sum + Number(result.max_marks),
            0
        );

        const obtainedMarks = results.reduce(
            (sum, result) =>
                sum + Number(result.marks_obtained),
            0
        );

        const percentage =
            totalMarks > 0
                ? (obtainedMarks / totalMarks) * 100
                : 0;

        return {
            totalSubjects: results.length,
            totalMarks,
            obtainedMarks,
            percentage,
        };
    }, [results]);

    function formatDate(dateString: string) {
        return new Date(
            `${dateString}T00:00:00`
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function formatTime(timeString: string) {
        if (!timeString) return "--";

        const [hours, minutes] =
            timeString.split(":");

        const date = new Date();

        date.setHours(
            Number(hours),
            Number(minutes),
            0,
            0
        );

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    }

    return (
        <AuthGuard allowedRoles={["student"]}>
            <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
                <div className="mx-auto max-w-7xl">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/dashboard/student/examination"
                                className="inline-flex items-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20 hover:text-blue-300"
                            >
                                📅 Examination Schedule
                            </Link>

                            <Link
                                href="/dashboard/student"
                                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                ← Dashboard
                            </Link>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm font-medium text-blue-400">
                                Campus ERP
                            </p>

                            <h1 className="mt-2 text-4xl font-bold tracking-tight">
                                Examination Results
                            </h1>

                            <p className="mt-3 text-slate-400">
                                View your examination marks,
                                grades and result details.
                            </p>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                            <p className="mt-4 text-sm text-slate-400">
                                Loading your results...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <p className="text-sm text-slate-400">
                                        Total Subjects
                                    </p>

                                    <p className="mt-2 text-3xl font-bold">
                                        {summary.totalSubjects}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <p className="text-sm text-slate-400">
                                        Marks Obtained
                                    </p>

                                    <p className="mt-2 text-3xl font-bold">
                                        {summary.obtainedMarks}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <p className="text-sm text-slate-400">
                                        Total Marks
                                    </p>

                                    <p className="mt-2 text-3xl font-bold">
                                        {summary.totalMarks}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <p className="text-sm text-slate-400">
                                        Overall Percentage
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-blue-400">
                                        {summary.percentage.toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="mt-8">
                                <div className="mb-5">
                                    <h2 className="text-2xl font-bold">
                                        Published Results
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Your examination performance
                                    </p>
                                </div>

                                {results.length === 0 ? (
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
                                        <div className="text-5xl">
                                            📋
                                        </div>

                                        <h3 className="mt-4 text-xl font-bold">
                                            No Results Available
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-400">
                                            Your examination results will
                                            appear here once they are published.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {results.map((result) => {
                                            const marks = Number(
                                                result.marks_obtained
                                            );

                                            const maxMarks = Number(
                                                result.max_marks
                                            );

                                            const percentage =
                                                maxMarks > 0
                                                    ? (marks / maxMarks) * 100
                                                    : 0;

                                            const isPass =
                                                result.result_status ===
                                                "PASS";

                                            return (
                                                <div
                                                    key={result.id}
                                                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                                                >
                                                    {/* Exam Header */}
                                                    <div className="border-b border-slate-800 p-6">
                                                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <h3 className="text-2xl font-bold">
                                                                        {result.subject}
                                                                    </h3>

                                                                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                                                                        {result.subject_code}
                                                                    </span>
                                                                </div>

                                                                <p className="mt-2 text-sm text-slate-400">
                                                                    {result.exam_type}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={`rounded-full px-4 py-2 text-sm font-bold ${isPass
                                                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                                                        : "border border-red-500/30 bg-red-500/10 text-red-400"
                                                                    }`}
                                                            >
                                                                {result.result_status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Exam Information */}
                                                    <div className="grid gap-4 border-b border-slate-800 p-6 sm:grid-cols-2 lg:grid-cols-4">

                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                Exam Date
                                                            </p>

                                                            <p className="mt-1 font-semibold">
                                                                {formatDate(
                                                                    result.exam_date
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                Time
                                                            </p>

                                                            <p className="mt-1 font-semibold">
                                                                {formatTime(
                                                                    result.start_time
                                                                )}{" "}
                                                                -{" "}
                                                                {formatTime(
                                                                    result.end_time
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                Room
                                                            </p>

                                                            <p className="mt-1 font-semibold">
                                                                {result.room}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                Exam ID
                                                            </p>

                                                            <p className="mt-1 font-semibold">
                                                                #{result.exam_id}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Marks */}
                                                    <div className="grid gap-4 p-6 sm:grid-cols-3">

                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                                                            <p className="text-sm text-slate-400">
                                                                Marks
                                                            </p>

                                                            <p className="mt-2 text-3xl font-bold">
                                                                {marks}
                                                                <span className="text-lg text-slate-500">
                                                                    {" "}
                                                                    / {maxMarks}
                                                                </span>
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                                                            <p className="text-sm text-slate-400">
                                                                Percentage
                                                            </p>

                                                            <p className="mt-2 text-3xl font-bold text-blue-400">
                                                                {percentage.toFixed(2)}%
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                                                            <p className="text-sm text-slate-400">
                                                                Grade
                                                            </p>

                                                            <p className="mt-2 text-3xl font-bold">
                                                                {result.grade}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Remarks */}
                                                    {result.remarks && (
                                                        <div className="border-t border-slate-800 px-6 py-5">
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                Remarks
                                                            </p>

                                                            <p className="mt-2 text-sm text-slate-300">
                                                                {result.remarks}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </AuthGuard>
    );
}