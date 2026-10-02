"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
    getMyDocuments,
    getDocumentFile,
    StudentDocument,
} from "@/services/documentService";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            setLoading(true);
            setError("");

            const response = await getMyDocuments();

            setDocuments(response.data);
        } catch (err) {
            console.error("Failed to load documents:", err);

            setError(
                "Unable to load your documents. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }
    async function handleViewDocument(
        document: StudentDocument
    ) {
        try {
            const blob = await getDocumentFile(
                document.id
            );

            const url = URL.createObjectURL(blob);

            window.open(url, "_blank");

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000);
        } catch (error) {
            console.error(
                "Failed to view document:",
                error
            );

            alert(
                "Unable to open this document. Please try again."
            );
        }
    }

    async function handleDownloadDocument(
        document: StudentDocument
    ) {
        try {
            const blob = await getDocumentFile(
                document.id
            );

            const url = URL.createObjectURL(blob);

            const link =
                window.document.createElement("a");

            link.href = url;
            link.download = document.file_name;

            window.document.body.appendChild(link);

            link.click();

            link.remove();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Failed to download document:",
                error
            );

            alert(
                "Unable to download this document. Please try again."
            );
        }
    }

    function formatDate(date: string) {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getDocumentIcon(type: string) {
        switch (type.toLowerCase()) {
            case "bonafide":
                return "📄";

            case "fee_receipt":
            case "fee receipt":
                return "🧾";

            case "no_dues":
            case "no-dues":
                return "✅";

            case "id_card":
            case "id card":
                return "🪪";

            case "marksheet":
                return "📊";

            case "certificate":
                return "🏆";

            default:
                return "📁";
        }
    }

    function getDocumentLabel(type: string) {
        switch (type.toLowerCase()) {
            case "bonafide":
                return "Bonafide Certificate";

            case "fee_receipt":
            case "fee receipt":
                return "Fee Receipt";

            case "no_dues":
            case "no-dues":
                return "No-Dues Certificate";

            case "id_card":
            case "id card":
                return "Student ID Card";

            case "marksheet":
                return "Marksheet";

            case "certificate":
                return "Certificate";

            default:
                return type;
        }
    }

    function getStatusStyle(status: string) {
        switch (status.toLowerCase()) {
            case "available":
                return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

            case "pending":
                return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

            case "expired":
                return "border-red-500/20 bg-red-500/10 text-red-400";

            default:
                return "border-slate-700 bg-slate-800 text-slate-400";
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                            <Link
                                href="/dashboard/student"
                                className="transition hover:text-white"
                            >
                                Student Dashboard
                            </Link>

                            <span>→</span>

                            <span className="text-slate-300">
                                Documents
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Documents
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Access and download your important academic
                            documents.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/student"
                        className="inline-flex w-fit items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                    >
                        ← Dashboard
                    </Link>
                </div>

                {/* Summary */}
                {!loading && !error && (
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-400">
                                Total Documents
                            </p>

                            <p className="mt-2 text-3xl font-bold text-white">
                                {documents.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-400">
                                Available
                            </p>

                            <p className="mt-2 text-3xl font-bold text-emerald-400">
                                {
                                    documents.filter(
                                        (document) =>
                                            document.status.toLowerCase() ===
                                            "available"
                                    ).length
                                }
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-400">
                                Latest Document
                            </p>

                            <p className="mt-2 truncate text-sm font-semibold text-white">
                                {documents.length > 0
                                    ? documents[0].title
                                    : "No documents"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-3xl border border-slate-800 bg-slate-900 p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-xl bg-slate-800" />
                                    <div className="h-6 w-20 rounded-full bg-slate-800" />
                                </div>

                                <div className="mt-6 h-5 w-48 rounded bg-slate-800" />

                                <div className="mt-3 h-4 w-full rounded bg-slate-800" />
                                <div className="mt-2 h-4 w-3/4 rounded bg-slate-800" />

                                <div className="mt-6 h-10 w-40 rounded-lg bg-slate-800" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                        <div className="text-4xl">⚠️</div>

                        <h2 className="mt-4 text-xl font-bold text-white">
                            Something went wrong
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-red-300">
                            {error}
                        </p>

                        <button
                            onClick={loadDocuments}
                            className="mt-6 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading &&
                    !error &&
                    documents.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-4xl">
                                📁
                            </div>

                            <h2 className="mt-6 text-2xl font-bold text-white">
                                No documents available
                            </h2>

                            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
                                Your academic documents will appear here
                                once they are issued by the administration.
                            </p>

                            <Link
                                href="/dashboard/student"
                                className="mt-6 inline-flex rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    )}

                {/* Documents */}
                {!loading &&
                    !error &&
                    documents.length > 0 && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {documents.map((document) => (
                                <div
                                    key={document.id}
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900/90"
                                >
                                    {/* Top */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                                            {getDocumentIcon(
                                                document.document_type
                                            )}
                                        </div>

                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                                document.status
                                            )}`}
                                        >
                                            {document.status}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="mt-5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                            {getDocumentLabel(
                                                document.document_type
                                            )}
                                        </p>

                                        <h2 className="mt-2 text-xl font-bold text-white">
                                            {document.title}
                                        </h2>

                                        <div className="mt-4 space-y-2 text-sm text-slate-400">
                                            <div className="flex items-center justify-between gap-4">
                                                <span>File</span>

                                                <span className="max-w-[65%] truncate text-right text-slate-300">
                                                    {document.file_name}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span>Issued</span>

                                                <span className="text-slate-300">
                                                    {formatDate(
                                                        document.issued_at
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleViewDocument(document)
                                            }
                                            className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                                        >
                                            View Document →
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDownloadDocument(document)
                                            }
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </main>
    );
}