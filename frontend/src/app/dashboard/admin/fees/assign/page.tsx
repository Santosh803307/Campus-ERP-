"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface Student {
    id: number;
    user_id: number;
    department_id: number;
    enrollment_no: string;
    course: string;
    semester: number;
    section: string | null;
    admission_year: number;
    is_active: boolean;
    created_at: string;
}

interface StudentPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface StudentListResponse {
    data: Student[];
    pagination: StudentPagination;
}

interface FeeStructure {
    id: number;
    department_id: number;
    course: string;
    semester: number;
    fee_type: string;
    amount: number | string;
    academic_year: string;
    is_active: boolean;
    created_at: string;
}

interface StudentFeeResponse {
    id: number;
    student_id: number;
    fee_structure_id: number;
    amount: number | string;
    paid_amount: number | string;
    due_date: string | null;
    status: string;
    created_at: string;
}

export default function AssignFeePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

    const [selectedStudent, setSelectedStudent] =
        useState("");

    const [selectedFeeStructure, setSelectedFeeStructure] =
        useState("");

    const [amount, setAmount] = useState("");

    const [dueDate, setDueDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ============================================================
    // LOAD STUDENTS + FEE STRUCTURES
    // ============================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [studentsResponse, feesResponse] =
                    await Promise.all([
                        api.get<StudentListResponse>(
                            "/api/students/?page=1&limit=100"
                        ),
                        api.get<FeeStructure[]>(
                            "/api/fees/structures"
                        ),
                    ]);

                setStudents(
                    studentsResponse.data.data
                );

                setFeeStructures(
                    feesResponse.data.filter(
                        (fee) => fee.is_active
                    )
                );
            } catch (err: any) {
                console.error(
                    "Assign fee data loading error:",
                    err
                );

                if (err?.response?.status === 401) {
                    setError(
                        "Session expired. Please login again."
                    );
                } else if (err?.response?.status === 403) {
                    setError(
                        "You do not have permission to assign fees."
                    );
                } else {
                    setError(
                        "Unable to load students or fee structures."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // ============================================================
    // FEE STRUCTURE SELECTION
    // ============================================================

    const handleFeeStructureChange = (
        value: string
    ) => {
        setSelectedFeeStructure(value);

        const selectedFee = feeStructures.find(
            (fee) => String(fee.id) === value
        );

        if (selectedFee) {
            setAmount(
                String(selectedFee.amount)
            );
        } else {
            setAmount("");
        }
    };

    // ============================================================
    // ASSIGN FEE
    // ============================================================

    const handleAssignFee = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // ----------------------------------------------------------
        // Validation
        // ----------------------------------------------------------

        if (!selectedStudent) {
            setError("Please select a student.");
            return;
        }

        if (!selectedFeeStructure) {
            setError("Please select a fee structure.");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid fee amount.");
            return;
        }

        try {
            setSubmitting(true);

            // --------------------------------------------------------
            // IMPORTANT:
            // Backend expects student_id = Student profile ID
            // --------------------------------------------------------

            const selectedStudentData =
                students.find(
                    (student) =>
                        String(student.id) ===
                        selectedStudent
                );

            if (!selectedStudentData) {
                setError("Selected student was not found.");
                return;
            }

            const payload = {
                student_id:
                    selectedStudentData.id,

                fee_structure_id:
                    Number(selectedFeeStructure),

                amount: Number(amount),

                due_date: dueDate
                    ? new Date(dueDate).toISOString()
                    : null,
            };

            const response =
                await api.post<StudentFeeResponse>(
                    "/api/fees/assign",
                    payload
                );

            console.log(
                "Fee assigned:",
                response.data
            );

            setSuccess(
                "Fee successfully assigned to the student."
            );

            // --------------------------------------------------------
            // Reset form
            // --------------------------------------------------------

            setSelectedStudent("");
            setSelectedFeeStructure("");
            setAmount("");
            setDueDate("");
        } catch (err: any) {
            console.error(
                "Fee assignment error:",
                err
            );

            if (err?.response?.status === 400) {
                setError(
                    err?.response?.data?.detail ||
                    "Invalid fee assignment."
                );
            } else if (err?.response?.status === 404) {
                setError(
                    err?.response?.data?.detail ||
                    "Student or fee structure not found."
                );
            } else if (err?.response?.status === 401) {
                setError(
                    "Session expired. Please login again."
                );
            } else if (err?.response?.status === 403) {
                setError(
                    "You do not have permission to assign fees."
                );
            } else {
                setError(
                    "Unable to assign fee. Please try again."
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthGuard allowedRoles={["admin"]}>
            <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
                <div className="mx-auto max-w-4xl">

                    {/* ================================================== */}
                    {/* HEADER */}
                    {/* ================================================== */}

                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>
                            <p className="font-semibold tracking-wide text-blue-400">
                                CAMPUS ERP
                            </p>

                            <h1 className="mt-2 text-4xl font-bold">
                                Assign Fee
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Assign a fee structure to a student.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/admin/fees"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                            ← Back to Fees
                        </Link>

                    </div>

                    {/* ================================================== */}
                    {/* ERROR */}
                    {/* ================================================== */}

                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                            <p className="font-semibold text-red-400">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* ================================================== */}
                    {/* SUCCESS */}
                    {/* ================================================== */}

                    {success && (
                        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                            <p className="font-semibold text-emerald-400">
                                ✅ {success}
                            </p>
                        </div>
                    )}

                    {/* ================================================== */}
                    {/* FORM */}
                    {/* ================================================== */}

                    <div className="rounded-2xl border border-blue-500/20 bg-slate-900 p-6 sm:p-8">

                        <form
                            onSubmit={handleAssignFee}
                            className="space-y-6"
                        >

                            {/* ================================================== */}
                            {/* STUDENT */}
                            {/* ================================================== */}

                            <div>

                                <label
                                    htmlFor="student"
                                    className="mb-2 block text-sm font-semibold text-slate-300"
                                >
                                    Student
                                </label>

                                <select
                                    id="student"
                                    value={selectedStudent}
                                    onChange={(event) =>
                                        setSelectedStudent(
                                            event.target.value
                                        )
                                    }
                                    disabled={loading || submitting}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    <option value="">
                                        {loading
                                            ? "Loading students..."
                                            : "Select Student"}
                                    </option>

                                    {students
                                        .filter(
                                            (student) =>
                                                student.is_active
                                        )
                                        .map((student) => (
                                            <option
                                                key={student.id}
                                                value={student.id}
                                            >
                                                {student.enrollment_no} —{" "}
                                                {student.course} —{" "}
                                                Semester{" "}
                                                {student.semester}
                                            </option>
                                        ))}

                                </select>

                                <p className="mt-2 text-xs text-slate-500">
                                    Select the student who should receive
                                    this fee.
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* FEE STRUCTURE */}
                            {/* ================================================== */}

                            <div>

                                <label
                                    htmlFor="feeStructure"
                                    className="mb-2 block text-sm font-semibold text-slate-300"
                                >
                                    Fee Structure
                                </label>

                                <select
                                    id="feeStructure"
                                    value={selectedFeeStructure}
                                    onChange={(event) =>
                                        handleFeeStructureChange(
                                            event.target.value
                                        )
                                    }
                                    disabled={loading || submitting}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    <option value="">
                                        {loading
                                            ? "Loading fee structures..."
                                            : "Select Fee Structure"}
                                    </option>

                                    {feeStructures.map((fee) => (
                                        <option
                                            key={fee.id}
                                            value={fee.id}
                                        >
                                            {fee.course} — Semester{" "}
                                            {fee.semester} —{" "}
                                            {fee.fee_type} — ₹
                                            {Number(
                                                fee.amount
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {/* ================================================== */}
                            {/* AMOUNT */}
                            {/* ================================================== */}

                            <div>

                                <label
                                    htmlFor="amount"
                                    className="mb-2 block text-sm font-semibold text-slate-300"
                                >
                                    Amount
                                </label>

                                <div className="relative">

                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        ₹
                                    </span>

                                    <input
                                        id="amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={amount}
                                        onChange={(event) =>
                                            setAmount(
                                                event.target.value
                                            )
                                        }
                                        disabled={submitting}
                                        placeholder="Enter fee amount"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    />

                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                    Amount is automatically filled from
                                    the selected fee structure.
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* DUE DATE */}
                            {/* ================================================== */}

                            <div>

                                <label
                                    htmlFor="dueDate"
                                    className="mb-2 block text-sm font-semibold text-slate-300"
                                >
                                    Due Date
                                </label>

                                <input
                                    id="dueDate"
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(event) =>
                                        setDueDate(
                                            event.target.value
                                        )
                                    }
                                    disabled={submitting}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Optional. Leave empty if there is no
                                    specific due date.
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* SUMMARY */}
                            {/* ================================================== */}

                            {selectedStudent &&
                                selectedFeeStructure && (
                                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

                                        <h2 className="font-bold text-blue-300">
                                            Assignment Summary
                                        </h2>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                                    Student
                                                </p>

                                                <p className="mt-1 font-semibold text-white">
                                                    {students.find(
                                                        (student) =>
                                                            String(
                                                                student.id
                                                            ) ===
                                                            selectedStudent
                                                    )?.enrollment_no ||
                                                        "—"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                                    Fee
                                                </p>

                                                <p className="mt-1 font-semibold text-white">
                                                    ₹
                                                    {Number(
                                                        amount || 0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </p>
                                            </div>

                                        </div>

                                    </div>
                                )}

                            {/* ================================================== */}
                            {/* SUBMIT */}
                            {/* ================================================== */}

                            <button
                                type="submit"
                                disabled={
                                    loading || submitting
                                }
                                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? "Assigning Fee..."
                                    : "Assign Fee"}
                            </button>

                        </form>

                    </div>

                    {/* ================================================== */}
                    {/* INFO */}
                    {/* ================================================== */}

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <h2 className="font-bold text-white">
                            💡 How Fee Assignment Works
                        </h2>

                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">

                            <li>
                                • Select an active student.
                            </li>

                            <li>
                                • Select an active fee structure.
                            </li>

                            <li>
                                • The fee amount is automatically loaded
                                from the selected structure.
                            </li>

                            <li>
                                • Set an optional due date.
                            </li>

                            <li>
                                • The assigned fee will appear in the
                                student's fee section.
                            </li>

                        </ul>

                    </div>

                </div>
            </main>
        </AuthGuard>
    );
}