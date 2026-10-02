"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  deleteDocument,
  getAdminDocumentFile,
  getAllDocuments,
  uploadDocument,
  StudentDocument,
} from "@/services/documentService";

import {
  searchStudents,
  StudentSearchResult,
} from "@/services/studentService";

const DOCUMENT_TYPES = [
  {
    value: "bonafide",
    label: "Bonafide Certificate",
  },
  {
    value: "fee_receipt",
    label: "Fee Receipt",
  },
  {
    value: "no_dues",
    label: "No-Dues Certificate",
  },
  {
    value: "id_card",
    label: "Student ID Card",
  },
  {
    value: "marksheet",
    label: "Marksheet",
  },
  {
    value: "certificate",
    label: "Certificate",
  },
  {
    value: "other",
    label: "Other",
  },
];

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<StudentDocument[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<StudentSearchResult | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<
    StudentSearchResult[]
  >([]);

  const [searchingStudents, setSearchingStudents] =
    useState(false);

  const [documentTypeFilter, setDocumentTypeFilter] =
    useState("");

  const [showUploadForm, setShowUploadForm] =
    useState(false);

  const [uploading, setUploading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    document_type: "",
    title: "",
    file: null as File | null,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments(
    studentId?: number,
    documentType?: string
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await getAllDocuments(
        studentId,
        documentType
      );

      setDocuments(response.data);
    } catch (err: any) {
      console.error(
        "Failed to load documents:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentSearch(
    value: string
  ) {
    setStudentSearch(value);
    setSelectedStudent(null);

    if (!value.trim()) {
      setStudentResults([]);
      await loadDocuments(
        undefined,
        documentTypeFilter || undefined
      );
      return;
    }

    try {
      setSearchingStudents(true);

      const results = await searchStudents(
        value
      );

      setStudentResults(results);
    } catch (err) {
      console.error(
        "Failed to search students:",
        err
      );

      setStudentResults([]);
    } finally {
      setSearchingStudents(false);
    }
  }

  async function handleSelectStudent(
    student: StudentSearchResult
  ) {
    setSelectedStudent(student);
    setStudentSearch(
      `${student.full_name} • ${student.enrollment_no}`
    );
    setStudentResults([]);

    await loadDocuments(
      student.id,
      documentTypeFilter || undefined
    );
  }

  async function handleDocumentTypeFilter(
    value: string
  ) {
    setDocumentTypeFilter(value);

    await loadDocuments(
      selectedStudent?.id,
      value || undefined
    );
  }

  async function handleClearFilters() {
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setDocumentTypeFilter("");

    await loadDocuments();
  }

  function openUploadForm() {
    setSuccess("");
    setError("");

    setUploadForm({
      document_type: "",
      title: "",
      file: null,
    });

    setShowUploadForm(true);
  }

  function closeUploadForm() {
    if (uploading) return;

    setShowUploadForm(false);

    setUploadForm({
      document_type: "",
      title: "",
      file: null,
    });
  }

  async function handleUpload(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedStudent) {
      setError(
        "Please search and select a student first."
      );
      return;
    }

    if (!uploadForm.document_type) {
      setError(
        "Please select a document type."
      );
      return;
    }

    if (!uploadForm.title.trim()) {
      setError(
        "Please enter the document title."
      );
      return;
    }

    if (!uploadForm.file) {
      setError(
        "Please select a PDF file."
      );
      return;
    }

    if (
      uploadForm.file.type !==
        "application/pdf" &&
      !uploadForm.file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError(
        "Only PDF files are allowed."
      );
      return;
    }

    if (
      uploadForm.file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "File size must not exceed 5 MB."
      );
      return;
    }

    try {
      setUploading(true);

      await uploadDocument(
        selectedStudent.id,
        uploadForm.document_type,
        uploadForm.title.trim(),
        uploadForm.file
      );

      setSuccess(
        "Document uploaded successfully."
      );

      setShowUploadForm(false);

      setUploadForm({
        document_type: "",
        title: "",
        file: null,
      });

      await loadDocuments(
        selectedStudent.id,
        documentTypeFilter || undefined
      );
    } catch (err: any) {
      console.error(
        "Failed to upload document:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleViewDocument(
    document: StudentDocument
  ) {
    try {
      setError("");

      const blob =
        await getAdminDocumentFile(
          document.id
        );

      const url =
        URL.createObjectURL(blob);

      window.open(url, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error(
        "Failed to view document:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to open document."
      );
    }
  }

  async function handleDeleteDocument(
    document: StudentDocument
  ) {
    const confirmed = window.confirm(
      `Delete "${document.title}"?\n\nThis will permanently remove the document file and database record.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteDocument(
        document.id
      );

      setSuccess(
        "Document deleted successfully."
      );

      await loadDocuments(
        selectedStudent?.id,
        documentTypeFilter || undefined
      );
    } catch (err: any) {
      console.error(
        "Failed to delete document:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to delete document."
      );
    }
  }

  function getDocumentIcon(
    type: string
  ) {
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

  function getDocumentLabel(
    type: string
  ) {
    const found =
      DOCUMENT_TYPES.find(
        (item) =>
          item.value ===
          type.toLowerCase()
      );

    return (
      found?.label || type
    );
  }

  function formatDate(
    date: string
  ) {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
              <Link
                href="/dashboard/admin"
                className="transition hover:text-white"
              >
                Admin Dashboard
              </Link>

              <span>→</span>

              <span className="text-slate-300">
                Documents
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Document Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Upload, manage, view and delete student
              documents from one place.
            </p>
          </div>

          <Link
            href="/dashboard/admin"
            className="inline-flex w-fit items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Documents
            </p>

            <p className="mt-2 text-3xl font-bold">
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
                  (item) =>
                    item.status.toLowerCase() ===
                    "available"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Selected Student
            </p>

            <p className="mt-2 truncate text-lg font-bold">
              {selectedStudent
                ? selectedStudent.full_name
                : "All Students"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">

            {/* Student Search */}
            <div className="relative flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Search Student
              </label>

              <input
                value={studentSearch}
                onChange={(event) =>
                  handleStudentSearch(
                    event.target.value
                  )
                }
                placeholder="Name, enrollment or email..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
              />

              {searchingStudents && (
                <div className="absolute right-4 top-11 text-xs text-slate-500">
                  Searching...
                </div>
              )}

              {studentResults.length > 0 && (
                <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
                  {studentResults.map(
                    (student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() =>
                          handleSelectStudent(
                            student
                          )
                        }
                        className="block w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-0 hover:bg-slate-800"
                      >
                        <p className="font-semibold text-white">
                          {student.full_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.enrollment_no}
                          {" • "}
                          {student.email}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.course}
                          {" • Semester "}
                          {student.semester}
                        </p>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Document Type */}
            <div className="w-full lg:w-64">
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Document Type
              </label>

              <select
                value={
                  documentTypeFilter
                }
                onChange={(event) =>
                  handleDocumentTypeFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  All Types
                </option>

                {DOCUMENT_TYPES.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Clear Filters
            </button>

            {/* Upload */}
            <button
              type="button"
              onClick={openUploadForm}
              className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              + Upload Document
            </button>
          </div>

          {selectedStudent && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  Selected Student
                </p>

                <p className="mt-1 font-bold text-white">
                  {selectedStudent.full_name}
                </p>

                <p className="text-xs text-slate-400">
                  {selectedStudent.enrollment_no}
                  {" • "}
                  {selectedStudent.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleStudentSearch("")
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Change Student
              </button>
            </div>
          )}
        </section>

        {/* Upload Form */}
        {showUploadForm && (
          <section className="mb-8 rounded-3xl border border-blue-500/20 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Upload Student Document
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Upload a PDF document for the selected student.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadForm}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {!selectedStudent && (
              <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
                First search and select a student from the
                section above.
              </div>
            )}

            {selectedStudent && (
              <form
                onSubmit={handleUpload}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Student
                    </label>

                    <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
                      <p className="font-semibold text-white">
                        {selectedStudent.full_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {selectedStudent.enrollment_no}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Document Type
                    </label>

                    <select
                      required
                      value={
                        uploadForm.document_type
                      }
                      onChange={(event) =>
                        setUploadForm({
                          ...uploadForm,
                          document_type:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Select Document Type
                      </option>

                      {DOCUMENT_TYPES.map(
                        (type) => (
                          <option
                            key={type.value}
                            value={type.value}
                          >
                            {type.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Document Title
                  </label>

                  <input
                    required
                    value={
                      uploadForm.title
                    }
                    onChange={(event) =>
                      setUploadForm({
                        ...uploadForm,
                        title:
                          event.target.value,
                      })
                    }
                    placeholder="Example: Bonafide Certificate - 2026"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    PDF File
                  </label>

                  <input
                    required
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) =>
                      setUploadForm({
                        ...uploadForm,
                        file:
                          event.target.files?.[0] ||
                          null,
                      })
                    }
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    PDF only • Maximum size 5 MB
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload Document"}
                  </button>

                  <button
                    type="button"
                    onClick={closeUploadForm}
                    disabled={uploading}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Documents Table */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

          <div className="flex flex-col gap-2 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                All Documents
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Manage issued student documents.
              </p>
            </div>

            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-400">
              {documents.length} documents
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">
                📁
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No documents found
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Try changing the filters or upload a new document.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-400">
                      Document
                    </th>

                    <th className="px-6 py-4 font-semibold text-slate-400">
                      Student
                    </th>

                    <th className="px-6 py-4 font-semibold text-slate-400">
                      Type
                    </th>

                    <th className="px-6 py-4 font-semibold text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 font-semibold text-slate-400">
                      Issued
                    </th>

                    <th className="px-6 py-4 text-right font-semibold text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map(
                    (document) => (
                      <tr
                        key={document.id}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                              {getDocumentIcon(
                                document.document_type
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-white">
                                {document.title}
                              </p>

                              <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                {document.file_name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-white">
                            {selectedStudent
                              ? selectedStudent.full_name
                              : `Student #${document.student_id}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {document.student_id}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {getDocumentLabel(
                            document.document_type
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-400">
                            {document.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-slate-400">
                          {formatDate(
                            document.issued_at
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleViewDocument(
                                  document
                                )
                              }
                              className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500 hover:text-white"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteDocument(
                                  document
                                )
                              }
                              className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
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
  );
}