"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AuthGuard from "@/components/AuthGuard";
import {
    Exam,
    getMyExams,
} from "@/services/examService";

function formatDate(dateString: string) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(":");

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function getDaysUntilExam(dateString: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(`${dateString}T00:00:00`);
    examDate.setHours(0, 0, 0, 0);

    const difference =
        examDate.getTime() - today.getTime();

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
}

function getExamStatus(exam: Exam) {
    const days = getDaysUntilExam(exam.exam_date);

    if (days < 0) {
        return {
            label: "Completed",
            className:
                "border-slate-700 bg-slate-800/60 text-slate-400",
        };
    }

    if (days === 0) {
        return {
            label: "Today",
            className:
                "border-red-500/30 bg-red-500/10 text-red-400",
        };
    }

    if (days <= 7) {
        return {
            label: `${days} day${days === 1 ? "" : "s"} left`,
            className:
                "border-amber-500/30 bg-amber-500/10 text-amber-400",
        };
    }

    return {
        label: "Upcoming",
        className:
            "border-blue-500/30 bg-blue-500/10 text-blue-400",
    };
}

function getExamTypeClass(examType: string) {
    const type = examType.toLowerCase();

    if (type.includes("final") || type.includes("end")) {
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }

    if (type.includes("mid")) {
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    if (type.includes("internal")) {
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }

    return "bg-slate-800 text-slate-300 border-slate-700";
}

export default function StudentExaminationPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadExams() {
            try {
                setLoading(true);
                setError("");

                const response = await getMyExams();

                setExams(response);
            } catch (err: unknown) {
                console.error("Failed to load examinations:", err);

                setError(
                    "Unable to load your examination schedule. Please try again."
                );
            } finally {
                setLoading(false);
            }
        }

        loadExams();
    }, []);

    const upcomingExams = useMemo(() => {
        return exams.filter(
            (exam) => getDaysUntilExam(exam.exam_date) >= 0
        );
    }, [exams]);

    const completedExams = useMemo(() => {
        return exams.filter(
            (exam) => getDaysUntilExam(exam.exam_date) < 0
        );
    }, [exams]);

    const nextExam = upcomingExams[0];

    return (
        <AuthGuard allowedRoles={["student"]}>
            <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
                <div className="mx-auto max-w-7xl">

                    {/* Header */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Link
                                href="/dashboard/student"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                            >
                                <span>←</span>
                                Back to Dashboard
                            </Link>

                            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-400">
                                Campus ERP
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Examination Schedule
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                                View your upcoming examinations, dates, timings,
                                rooms and examination details.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/dashboard/student/results"
                            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            📊 View Examination Results
                        </Link>

                        <Link
                            href="/dashboard/student"
                            className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                        >
                            ← Dashboard
                        </Link>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
                                >
                                    <div className="h-5 w-32 rounded bg-slate-800" />
                                    <div className="mt-4 h-8 w-48 rounded bg-slate-800" />
                                    <div className="mt-6 h-4 w-full rounded bg-slate-800" />
                                    <div className="mt-3 h-4 w-3/4 rounded bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-xl">
                                    ⚠️
                                </div>

                                <div>
                                    <h2 className="font-semibold text-red-300">
                                        Unable to load examination schedule
                                    </h2>

                                    <p className="mt-1 text-sm text-red-400/80">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* Statistics */}
                            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                    <p className="text-sm text-slate-400">
                                        Total Exams
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-white">
                                        {exams.length}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        In your examination schedule
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                    <p className="text-sm text-slate-400">
                                        Upcoming
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-blue-400">
                                        {upcomingExams.length}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Examinations remaining
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                    <p className="text-sm text-slate-400">
                                        Completed
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-slate-300">
                                        {completedExams.length}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Previous examinations
                                    </p>
                                </div>
                            </div>

                            {/* Next Exam */}
                            {nextExam && (
                                <div className="mt-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900">
                                    <div className="p-6 sm:p-7">
                                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                                                        Next Examination
                                                    </span>

                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getExamStatus(nextExam).className
                                                            }`}
                                                    >
                                                        {getExamStatus(nextExam).label}
                                                    </span>
                                                </div>

                                                <h2 className="mt-4 text-2xl font-bold text-white">
                                                    {nextExam.subject}
                                                </h2>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    {nextExam.subject_code}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                                    <p className="text-xs text-slate-500">
                                                        Date
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-white">
                                                        {formatDate(nextExam.exam_date)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                                    <p className="text-xs text-slate-500">
                                                        Time
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-white">
                                                        {formatTime(nextExam.start_time)}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                                    <p className="text-xs text-slate-500">
                                                        Room
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-white">
                                                        {nextExam.room}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                                    <p className="text-xs text-slate-500">
                                                        Type
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-white">
                                                        {nextExam.exam_type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {exams.length === 0 && (
                                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-16 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                                        📚
                                    </div>

                                    <h2 className="mt-5 text-xl font-bold text-white">
                                        No examinations scheduled
                                    </h2>

                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                                        Your examination schedule will appear here
                                        once it has been published by the college
                                        administration.
                                    </p>

                                    <Link
                                        href="/dashboard/student"
                                        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                                    >
                                        Back to Dashboard
                                    </Link>
                                </div>
                            )}

                            {/* Exam List */}
                            {exams.length > 0 && (
                                <section className="mt-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white">
                                                Examination Timetable
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Complete schedule for your semester
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {exams.map((exam) => {
                                            const status = getExamStatus(exam);
                                            const days =
                                                getDaysUntilExam(exam.exam_date);

                                            return (
                                                <div
                                                    key={exam.id}
                                                    className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900 sm:p-6"
                                                >
                                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                                        {/* Subject */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span
                                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getExamTypeClass(
                                                                        exam.exam_type
                                                                    )}`}
                                                                >
                                                                    {exam.exam_type}
                                                                </span>

                                                                <span
                                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                                                                >
                                                                    {status.label}
                                                                </span>
                                                            </div>

                                                            <h3 className="mt-3 truncate text-lg font-bold text-white sm:text-xl">
                                                                {exam.subject}
                                                            </h3>

                                                            <p className="mt-1 text-sm font-medium text-slate-500">
                                                                {exam.subject_code}
                                                            </p>
                                                        </div>

                                                        {/* Exam Details */}
                                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[620px]">
                                                            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                                                                <p className="text-xs text-slate-500">
                                                                    Date
                                                                </p>

                                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                                    {formatDate(exam.exam_date)}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                                                                <p className="text-xs text-slate-500">
                                                                    Time
                                                                </p>

                                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                                    {formatTime(exam.start_time)}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-500">
                                                                    to{" "}
                                                                    {formatTime(exam.end_time)}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                                                                <p className="text-xs text-slate-500">
                                                                    Room
                                                                </p>

                                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                                    {exam.room}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                                                                <p className="text-xs text-slate-500">
                                                                    Countdown
                                                                </p>

                                                                <p className="mt-1 text-sm font-semibold text-slate-200">
                                                                    {days < 0
                                                                        ? "Completed"
                                                                        : days === 0
                                                                            ? "Today"
                                                                            : `${days} day${days === 1
                                                                                ? ""
                                                                                : "s"
                                                                            }`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>
        </AuthGuard>
    );
}