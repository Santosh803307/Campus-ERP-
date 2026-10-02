"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import {
    createExam,
    deleteExam,
    getExams,
    updateExam,
    type Exam,
    type ExamCreatePayload,
} from "@/services/examService";

import {
    createExamResult,
    deleteExamResult,
    getExamResults,
    updateExamResult,
    type ExamResult,
    type ExamResultCreatePayload,
} from "@/services/examResultService";

import {
    searchStudents,
    type StudentSearchResult,
} from "@/services/studentService";

type Tab = "exams" | "results";

const initialExamForm: ExamCreatePayload = {
    subject: "",
    subject_code: "",
    exam_type: "Mid Term",
    exam_date: "",
    start_time: "",
    end_time: "",
    room: "",
    semester: 7,
    course: "B.Tech CSE",
};

export default function AdminExaminationPage() {
    return (
        <AuthGuard allowedRoles={["admin"]}>
            <ExaminationContent />
        </AuthGuard>
    );
}

function ExaminationContent() {

    const [studentSearch, setStudentSearch] =
        useState("");

    const [studentResults, setStudentResults] =
        useState<StudentSearchResult[]>([]);

    const [selectedStudent, setSelectedStudent] =
        useState<StudentSearchResult | null>(null);

    const [searchingStudents, setSearchingStudents] =
        useState(false);

    const router = useRouter();

    const [activeTab, setActiveTab] =
        useState<Tab>("exams");

    const [exams, setExams] = useState<Exam[]>([]);
    const [results, setResults] =
        useState<ExamResult[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [semesterFilter, setSemesterFilter] =
        useState("");

    const [courseFilter, setCourseFilter] =
        useState("");

    const [examTypeFilter, setExamTypeFilter] =
        useState("");

    const [showExamForm, setShowExamForm] =
        useState(false);

    const [editingExam, setEditingExam] =
        useState<Exam | null>(null);

    const [examForm, setExamForm] =
        useState<ExamCreatePayload>(
            initialExamForm
        );

    const [savingExam, setSavingExam] =
        useState(false);

    const [selectedExamId, setSelectedExamId] =
        useState<number | undefined>();

    const [showResultForm, setShowResultForm] =
        useState(false);

    const [editingResult, setEditingResult] =
        useState<ExamResult | null>(null);

    const [resultForm, setResultForm] =
        useState<ExamResultCreatePayload>({
            exam_id: 0,
            student_id: 0,
            marks_obtained: 0,
            max_marks: 100,
            remarks: "",
        });

    const [savingResult, setSavingResult] =
        useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    async function loadExams() {
        try {
            setLoading(true);
            setError("");

            const response = await getExams();

            setExams(response.data);

            if (
                response.data.length > 0 &&
                !selectedExamId
            ) {
                setSelectedExamId(
                    response.data[0].id
                );
            }
        } catch (err) {
            console.error(err);
            setError(
                "Failed to load examination data."
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadResults(
        examId?: number
    ) {
        try {
            setError("");

            const response =
                await getExamResults(examId);

            setResults(response.data);
        } catch (err) {
            console.error(err);
            setError(
                "Failed to load examination results."
            );
        }
    }

    async function handleSearch() {
        try {
            setLoading(true);
            setError("");

            const response = await getExams({
                search: search || undefined,
                semester: semesterFilter
                    ? Number(semesterFilter)
                    : undefined,
                course: courseFilter || undefined,
                exam_type:
                    examTypeFilter || undefined,
            });

            setExams(response.data);
        } catch (err) {
            console.error(err);
            setError(
                "Failed to search examinations."
            );
        } finally {
            setLoading(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setSemesterFilter("");
        setCourseFilter("");
        setExamTypeFilter("");
        loadExams();
    }

    function openAddExam() {
        setEditingExam(null);
        setExamForm(initialExamForm);
        setShowExamForm(true);
    }

    function openEditExam(exam: Exam) {
        setEditingExam(exam);

        setExamForm({
            subject: exam.subject,
            subject_code: exam.subject_code,
            exam_type: exam.exam_type,
            exam_date: exam.exam_date,
            start_time: exam.start_time.slice(0, 5),
            end_time: exam.end_time.slice(0, 5),
            room: exam.room,
            semester: exam.semester,
            course: exam.course,
        });

        setShowExamForm(true);
    }

    async function handleSaveExam() {
        try {
            setSavingExam(true);
            setError("");
            setSuccess("");

            if (editingExam) {
                await updateExam(
                    editingExam.id,
                    examForm
                );

                setSuccess(
                    "Examination updated successfully."
                );
            } else {
                await createExam(examForm);

                setSuccess(
                    "Examination created successfully."
                );
            }

            setShowExamForm(false);
            setEditingExam(null);

            await loadExams();
        } catch (err: any) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Failed to save examination."
            );
        } finally {
            setSavingExam(false);
        }
    }

    async function handleDeleteExam(
        exam: Exam
    ) {
        const confirmed = window.confirm(
            `Delete "${exam.subject}" exam?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await deleteExam(exam.id);

            setSuccess(
                "Examination deleted successfully."
            );

            if (selectedExamId === exam.id) {
                setSelectedExamId(undefined);
                setResults([]);
            }

            await loadExams();
        } catch (err: any) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Failed to delete examination."
            );
        }
    }

    function openAddResult() {
        setEditingResult(null);

        setStudentSearch("");
        setStudentResults([]);
        setSelectedStudent(null);

        const defaultExamId =
            selectedExamId ||
            exams[0]?.id ||
            0;

        setResultForm({
            exam_id: defaultExamId,
            student_id: 0,
            marks_obtained: 0,
            max_marks: 100,
            remarks: "",
        });

        setShowResultForm(true);
    }

    function openEditResult(
        result: ExamResult
    ) {
        setEditingResult(result);

        setResultForm({
            exam_id: result.exam_id,
            student_id: result.student_id,
            marks_obtained:
                Number(result.marks_obtained),
            max_marks: Number(result.max_marks),
            remarks: result.remarks || "",
        });

        setShowResultForm(true);
    }
    async function handleStudentSearch(
        value: string
    ) {
        setStudentSearch(value);

        if (!value.trim()) {
            setStudentResults([]);
            return;
        }

        try {
            setSearchingStudents(true);

            const students =
                await searchStudents(value);

            setStudentResults(students);
        } catch (err) {
            console.error(err);
            setStudentResults([]);
        } finally {
            setSearchingStudents(false);
        }
    }

    async function handleSaveResult() {
        try {
            setSavingResult(true);
            setError("");
            setSuccess("");

            const examId = Number(resultForm.exam_id);
            const studentId = Number(resultForm.student_id);
            const marks = Number(resultForm.marks_obtained);
            const maxMarks = Number(resultForm.max_marks);

            // =====================================================
            // BASIC VALIDATION
            // =====================================================

            if (!examId) {
                setError("Please select an examination.");
                return;
            }

            if (!studentId) {
                setError(
                    "Please search and select a student."
                );
                return;
            }

            if (
                !Number.isFinite(marks) ||
                marks < 0
            ) {
                setError(
                    "Marks obtained must be a valid number."
                );
                return;
            }

            if (
                !Number.isFinite(maxMarks) ||
                maxMarks <= 0
            ) {
                setError(
                    "Maximum marks must be greater than 0."
                );
                return;
            }

            if (marks > maxMarks) {
                setError(
                    "Marks obtained cannot be greater than maximum marks."
                );
                return;
            }

            // =====================================================
            // KEEP SELECTED EXAM IN SYNC
            // =====================================================

            setSelectedExamId(examId);

            // =====================================================
            // UPDATE EXISTING RESULT
            // =====================================================

            if (editingResult) {
                await updateExamResult(
                    editingResult.id,
                    {
                        marks_obtained: marks,
                        max_marks: maxMarks,
                        remarks:
                            resultForm.remarks?.trim() ||
                            undefined,
                    }
                );

                setSuccess(
                    "Result updated successfully."
                );
            }

            // =====================================================
            // CREATE NEW RESULT
            // =====================================================

            else {
                // -------------------------------------------------
                // CHECK DUPLICATE RESULT BEFORE API REQUEST
                // -------------------------------------------------

                const existingResult =
                    results.find(
                        (result) =>
                            result.exam_id === examId &&
                            result.student_id === studentId
                    );

                if (existingResult) {
                    setError(
                        `Result already exists for this student in the selected examination. Result ID: #${existingResult.id}. Please use Edit instead.`
                    );

                    return;
                }

                // -------------------------------------------------
                // CREATE RESULT
                // -------------------------------------------------

                await createExamResult({
                    exam_id: examId,
                    student_id: studentId,
                    marks_obtained: marks,
                    max_marks: maxMarks,
                    remarks:
                        resultForm.remarks?.trim() ||
                        undefined,
                });

                setSuccess(
                    "Student result added successfully."
                );
            }

            // =====================================================
            // RESET MODAL
            // =====================================================

            setShowResultForm(false);
            setEditingResult(null);

            setStudentSearch("");
            setStudentResults([]);
            setSelectedStudent(null);

            // =====================================================
            // RELOAD RESULTS
            // =====================================================

            await loadResults(examId);

        } catch (err: any) {
            console.error(
                "Failed to save student result:",
                err
            );

            const status =
                err?.response?.status;

            const detail =
                err?.response?.data?.detail;

            if (status === 409) {
                setError(
                    "Result already exists for this student and examination. Please edit the existing result instead."
                );
            } else if (status === 400) {
                setError(
                    detail ||
                    "Student and examination details are not compatible."
                );
            } else if (status === 404) {
                setError(
                    detail ||
                    "Student or examination not found."
                );
            } else {
                setError(
                    detail ||
                    "Failed to save student result."
                );
            }
        } finally {
            setSavingResult(false);
        }
    }
    async function handleDeleteResult(
        result: ExamResult
    ) {
        const confirmed = window.confirm(
            `Delete result #${result.id}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await deleteExamResult(
                result.id
            );

            setSuccess(
                "Result deleted successfully."
            );

            await loadResults(
                selectedExamId
            );
        } catch (err: any) {
            console.error(err);

            setError(
                err?.response?.data?.detail ||
                "Failed to delete result."
            );
        }
    }

    function handleExamSelection(
        examId: number
    ) {
        setSelectedExamId(examId);
        loadResults(examId);
    }

    const resultOverview = useMemo(() => {
        const total = results.length;

        const passed = results.filter(
            (item) =>
                item.result_status === "PASS"
        ).length;

        const failed = results.filter(
            (item) =>
                item.result_status === "FAIL"
        ).length;

        const average =
            total > 0
                ? results.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.marks_obtained
                        ),
                    0
                ) / total
                : 0;

        return {
            total,
            passed,
            failed,
            average,
        };
    }, [results]);

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-sm font-semibold text-blue-400">
                            CAMPUS ERP
                        </p>

                        <h1 className="text-2xl font-bold">
                            Examination Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Manage examinations, timetable and
                            student results.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/dashboard/admin"
                            )
                        }
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                        ← Dashboard
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-8">
                {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {success}
                    </div>
                )}

                {/* Tabs */}

                <div className="mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
                    <button
                        type="button"
                        onClick={() =>
                            setActiveTab("exams")
                        }
                        className={`rounded-lg px-5 py-2.5 text-sm font-medium ${activeTab === "exams"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        Examinations
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("results");

                            if (!results.length) {
                                loadResults(
                                    selectedExamId
                                );
                            }
                        }}
                        className={`rounded-lg px-5 py-2.5 text-sm font-medium ${activeTab === "results"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        Student Results
                    </button>
                </div>

                {activeTab === "exams" ? (
                    <>
                        {/* Search / Filters */}

                        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Search & Filters
                                </h2>

                                <button
                                    type="button"
                                    onClick={openAddExam}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                                >
                                    + Add Examination
                                </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search subject, code, room..."
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500 lg:col-span-2"
                                />

                                <select
                                    value={semesterFilter}
                                    onChange={(e) =>
                                        setSemesterFilter(
                                            e.target.value
                                        )
                                    }
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        All Semesters
                                    </option>

                                    {Array.from(
                                        { length: 8 },
                                        (_, index) =>
                                            index + 1
                                    ).map((semester) => (
                                        <option
                                            key={semester}
                                            value={semester}
                                        >
                                            Semester {semester}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={examTypeFilter}
                                    onChange={(e) =>
                                        setExamTypeFilter(
                                            e.target.value
                                        )
                                    }
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        All Exam Types
                                    </option>
                                    <option value="Mid Term">
                                        Mid Term
                                    </option>
                                    <option value="End Term">
                                        End Term
                                    </option>
                                    <option value="Practical">
                                        Practical
                                    </option>
                                    <option value="Internal">
                                        Internal
                                    </option>
                                </select>

                                <input
                                    value={courseFilter}
                                    onChange={(e) =>
                                        setCourseFilter(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Course"
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
                                >
                                    Search
                                </button>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                                >
                                    Reset
                                </button>
                            </div>
                        </section>

                        {/* Exam Table */}

                        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                            <div className="border-b border-slate-800 px-5 py-4">
                                <h2 className="font-semibold">
                                    Examination Timetable
                                </h2>
                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-400">
                                    Loading examinations...
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">
                                    No examinations found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-950 text-slate-400">
                                            <tr>
                                                <th className="px-5 py-4">
                                                    Subject
                                                </th>
                                                <th className="px-5 py-4">
                                                    Type
                                                </th>
                                                <th className="px-5 py-4">
                                                    Date
                                                </th>
                                                <th className="px-5 py-4">
                                                    Time
                                                </th>
                                                <th className="px-5 py-4">
                                                    Room
                                                </th>
                                                <th className="px-5 py-4">
                                                    Semester
                                                </th>
                                                <th className="px-5 py-4">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {exams.map((exam) => (
                                                <tr
                                                    key={exam.id}
                                                    className="border-t border-slate-800 hover:bg-slate-800/40"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium">
                                                            {exam.subject}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {exam.subject_code}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
                                                            {exam.exam_type}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {exam.exam_date}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {exam.start_time.slice(
                                                            0,
                                                            5
                                                        )}{" "}
                                                        -{" "}
                                                        {exam.end_time.slice(
                                                            0,
                                                            5
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {exam.room}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        Sem {exam.semester}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditExam(
                                                                        exam
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteExam(
                                                                        exam
                                                                    )
                                                                }
                                                                className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/20"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <>
                        {/* Result Overview */}

                        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <OverviewCard
                                title="Total Results"
                                value={resultOverview.total}
                            />

                            <OverviewCard
                                title="Passed"
                                value={resultOverview.passed}
                            />

                            <OverviewCard
                                title="Failed"
                                value={resultOverview.failed}
                            />

                            <OverviewCard
                                title="Average Marks"
                                value={resultOverview.average.toFixed(
                                    2
                                )}
                            />
                        </section>

                        {/* Result Controls */}

                        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div className="w-full md:max-w-md">
                                    <label className="mb-2 block text-sm text-slate-400">
                                        Select Examination
                                    </label>

                                    <select
                                        value={
                                            selectedExamId || ""
                                        }
                                        onChange={(e) => {
                                            const id =
                                                Number(
                                                    e.target.value
                                                );

                                            setSelectedExamId(id);

                                            loadResults(id);
                                        }}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
                                    >
                                        <option value="">
                                            Select examination
                                        </option>

                                        {exams.map((exam) => (
                                            <option
                                                key={exam.id}
                                                value={exam.id}
                                            >
                                                {exam.subject} -{" "}
                                                {exam.subject_code}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={openAddResult}
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500"
                                >
                                    + Add Student Result
                                </button>
                            </div>
                        </section>

                        {/* Results Table */}

                        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                            <div className="border-b border-slate-800 px-5 py-4">
                                <h2 className="font-semibold">
                                    Student Results
                                </h2>
                            </div>

                            {results.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">
                                    No results found for the
                                    selected examination.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-950 text-slate-400">
                                            <tr>
                                                <th className="px-5 py-4">
                                                    Result ID
                                                </th>
                                                <th className="px-5 py-4">
                                                    Student ID
                                                </th>
                                                <th className="px-5 py-4">
                                                    Marks
                                                </th>
                                                <th className="px-5 py-4">
                                                    Grade
                                                </th>
                                                <th className="px-5 py-4">
                                                    Status
                                                </th>
                                                <th className="px-5 py-4">
                                                    Remarks
                                                </th>
                                                <th className="px-5 py-4">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {results.map(
                                                (result) => (
                                                    <tr
                                                        key={result.id}
                                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-5 py-4">
                                                            #{result.id}
                                                        </td>

                                                        <td className="px-5 py-4 font-medium">
                                                            {
                                                                result.student_id
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                result.marks_obtained
                                                            }{" "}
                                                            /{" "}
                                                            {
                                                                result.max_marks
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 font-bold">
                                                            {result.grade}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`rounded-full px-2.5 py-1 text-xs ${result.result_status ===
                                                                    "PASS"
                                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                                    : "bg-red-500/10 text-red-300"
                                                                    }`}
                                                            >
                                                                {
                                                                    result.result_status
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4 text-slate-400">
                                                            {result.remarks ||
                                                                "—"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEditResult(
                                                                            result
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteResult(
                                                                            result
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/20"
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
                    </>
                )}
            </div>

            {/* Exam Modal */}

            {showExamForm && (
                <Modal
                    title={
                        editingExam
                            ? "Edit Examination"
                            : "Add Examination"
                    }
                    onClose={() =>
                        setShowExamForm(false)
                    }
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormInput
                            label="Subject"
                            value={examForm.subject}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    subject: value,
                                })
                            }
                        />

                        <FormInput
                            label="Subject Code"
                            value={examForm.subject_code}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    subject_code: value,
                                })
                            }
                        />

                        <FormSelect
                            label="Exam Type"
                            value={examForm.exam_type}
                            options={[
                                "Mid Term",
                                "End Term",
                                "Practical",
                                "Internal",
                            ]}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    exam_type: value,
                                })
                            }
                        />

                        <FormInput
                            label="Exam Date"
                            type="date"
                            value={examForm.exam_date}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    exam_date: value,
                                })
                            }
                        />

                        <FormInput
                            label="Start Time"
                            type="time"
                            value={examForm.start_time}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    start_time: value,
                                })
                            }
                        />

                        <FormInput
                            label="End Time"
                            type="time"
                            value={examForm.end_time}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    end_time: value,
                                })
                            }
                        />

                        <FormInput
                            label="Room"
                            value={examForm.room}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    room: value,
                                })
                            }
                        />

                        <FormInput
                            label="Semester"
                            type="number"
                            value={String(
                                examForm.semester
                            )}
                            onChange={(value) =>
                                setExamForm({
                                    ...examForm,
                                    semester: Number(value),
                                })
                            }
                        />

                        <div className="md:col-span-2">
                            <FormInput
                                label="Course"
                                value={examForm.course}
                                onChange={(value) =>
                                    setExamForm({
                                        ...examForm,
                                        course: value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setShowExamForm(false)
                            }
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={savingExam}
                            onClick={handleSaveExam}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium disabled:opacity-50"
                        >
                            {savingExam
                                ? "Saving..."
                                : editingExam
                                    ? "Update Exam"
                                    : "Create Exam"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Result Modal */}

            {showResultForm && (
                <Modal
                    title={
                        editingResult
                            ? "Update Student Result"
                            : "Add Student Result"
                    }
                    onClose={() =>
                        setShowResultForm(false)
                    }
                >
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-2 block text-sm text-slate-400">
                                Examination
                            </label>

                            <select
                                value={
                                    resultForm.exam_id
                                        ? String(resultForm.exam_id)
                                        : ""
                                }
                                onChange={(e) => {
                                    const examId = Number(
                                        e.target.value
                                    );

                                    setResultForm({
                                        ...resultForm,
                                        exam_id: examId,
                                        student_id: 0,
                                    });

                                    setSelectedStudent(null);
                                    setStudentSearch("");
                                    setStudentResults([]);
                                }}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select Examination
                                </option>

                                {exams.map((exam) => (
                                    <option
                                        key={exam.id}
                                        value={String(exam.id)}
                                    >
                                        {exam.subject} -{" "}
                                        {exam.subject_code}
                                        {" • Semester "}
                                        {exam.semester}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {editingResult ? (
                            <div>
                                <label className="mb-2 block text-sm text-slate-400">
                                    Student
                                </label>

                                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                                    <p className="font-medium text-white">
                                        Student ID: {resultForm.student_id}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Student cannot be changed while
                                        updating a result.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <label className="mb-2 block text-sm text-slate-400">
                                    Search Student
                                </label>

                                <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={(e) =>
                                        handleStudentSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search by name, enrollment or email..."
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                />

                                {searchingStudents && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Searching students...
                                    </p>
                                )}

                                {!searchingStudents &&
                                    studentResults.length > 0 && (
                                        <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                                            {studentResults.map(
                                                (student) => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedStudent(
                                                                student
                                                            );

                                                            setResultForm({
                                                                ...resultForm,
                                                                student_id:
                                                                    student.id,
                                                            });

                                                            setStudentSearch(
                                                                student.full_name
                                                            );

                                                            setStudentResults([]);
                                                        }}
                                                        className="block w-full border-b border-slate-800 px-4 py-3 text-left last:border-b-0 hover:bg-slate-800"
                                                    >
                                                        <p className="font-medium text-white">
                                                            {student.full_name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {student.enrollment_no}
                                                            {" • "}
                                                            {student.course}
                                                            {" • Sem "}
                                                            {student.semester}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {student.email}
                                                        </p>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                {studentSearch.trim() &&
                                    !searchingStudents &&
                                    studentResults.length === 0 &&
                                    !selectedStudent && (
                                        <p className="mt-2 text-xs text-slate-500">
                                            No students found.
                                        </p>
                                    )}

                                {selectedStudent && (
                                    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-emerald-300">
                                                    ✓ {selectedStudent.full_name}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-300">
                                                    {selectedStudent.enrollment_no}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {selectedStudent.course}
                                                    {" • Semester "}
                                                    {selectedStudent.semester}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Student ID:{" "}
                                                    {selectedStudent.id}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStudent(null);
                                                    setStudentSearch("");
                                                    setStudentResults([]);

                                                    setResultForm({
                                                        ...resultForm,
                                                        student_id: 0,
                                                    });
                                                }}
                                                className="text-xs text-red-300 hover:text-red-200"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormInput
                                label="Marks Obtained"
                                type="number"
                                value={String(
                                    resultForm.marks_obtained
                                )}
                                onChange={(value) =>
                                    setResultForm({
                                        ...resultForm,
                                        marks_obtained:
                                            Number(value),
                                    })
                                }
                            />

                            <FormInput
                                label="Maximum Marks"
                                type="number"
                                value={String(
                                    resultForm.max_marks
                                )}
                                onChange={(value) =>
                                    setResultForm({
                                        ...resultForm,
                                        max_marks:
                                            Number(value),
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-400">
                                Remarks
                            </label>

                            <textarea
                                value={
                                    resultForm.remarks || ""
                                }
                                onChange={(e) =>
                                    setResultForm({
                                        ...resultForm,
                                        remarks:
                                            e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="Optional remarks"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setShowResultForm(false)
                            }
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={savingResult}
                            onClick={handleSaveResult}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium disabled:opacity-50"
                        >
                            {savingResult
                                ? "Saving..."
                                : editingResult
                                    ? "Update Result"
                                    : "Add Result"}
                        </button>
                    </div>
                </Modal>
            )}
        </main>
    );
}

function OverviewCard({
    title,
    value,
}: {
    title: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
                {title}
            </p>

            <p className="mt-2 text-3xl font-bold">
                {value}
            </p>
        </div>
    );
}

function FormInput({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-400">
                {label}
            </label>

            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
}

function FormSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-400">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm"
            >
                <option value="">
                    Select {label}
                </option>

                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                    >
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function Modal({
    title,
    children,
    onClose,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}