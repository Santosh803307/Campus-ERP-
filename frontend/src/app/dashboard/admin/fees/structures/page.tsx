"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
}

interface FeeStructure {
  id: number;
  department_id: number;
  course: string;
  semester: number;
  fee_type: string;
  amount: number;
  academic_year: string;
  created_at: string;
}

interface FeeForm {
  department_id: string;
  course: string;
  semester: string;
  fee_type: string;
  amount: string;
  academic_year: string;
}

const initialForm: FeeForm = {
  department_id: "",
  course: "",
  semester: "",
  fee_type: "",
  amount: "",
  academic_year: "2026-27",
};

export default function FeeStructuresPage() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] =
    useState<FeeForm>(initialForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [feesResponse, departmentsResponse] =
        await Promise.all([
          api.get<FeeStructure[]>(
            "/api/fees/structures"
          ),
          api.get<{
            data: Department[];
            total: number;
            page: number;
            limit: number;
          }>(
            "/api/departments"
          ),
        ]);

      setFees(feesResponse.data);

      setDepartments(
        departmentsResponse.data.data
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
        "Unable to load fee structures."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (
    field: keyof FeeForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.department_id) {
      setError("Please select a department.");
      return;
    }

    if (!form.course.trim()) {
      setError("Please enter course name.");
      return;
    }

    if (!form.semester) {
      setError("Please enter semester.");
      return;
    }

    if (!form.fee_type.trim()) {
      setError("Please enter fee type.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.academic_year.trim()) {
      setError("Please enter academic year.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        department_id: Number(
          form.department_id
        ),
        course: form.course.trim(),
        semester: Number(form.semester),
        fee_type: form.fee_type.trim(),
        amount: Number(form.amount),
        academic_year:
          form.academic_year.trim(),
      };

      if (editingId) {
        await api.patch(
          `/api/fees/structures/${editingId}`,
          payload
        );

        setSuccess(
          "Fee structure updated successfully."
        );
      } else {
        await api.post(
          "/api/fees/structures",
          payload
        );

        setSuccess(
          "Fee structure created successfully."
        );
      }

      setForm(initialForm);
      setEditingId(null);

      await loadData();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
        "Unable to save fee structure."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (
    fee: FeeStructure
  ) => {
    setEditingId(fee.id);

    setForm({
      department_id: String(
        fee.department_id
      ),
      course: fee.course,
      semester: String(
        fee.semester
      ),
      fee_type: fee.fee_type,
      amount: String(fee.amount),
      academic_year:
        fee.academic_year,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  // ============================================================
  // DEPARTMENT NAME
  // ============================================================

  const getDepartmentName = (
    departmentId: number
  ) => {
    const department =
      departments.find(
        (item) =>
          item.id === departmentId
      );

    return (
      department?.name ||
      `Department #${departmentId}`
    );
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div>
            <p className="font-semibold tracking-wide text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Fee Structures
            </h1>

            <p className="mt-2 text-slate-400">
              Create, update and manage academic fee
              structures.
            </p>
          </div>

          {/* ================================================== */}
          {/* ALERTS */}
          {/* ================================================== */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-400">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-400">
                {success}
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* FORM */}
          {/* ================================================== */}

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId
                    ? "✏️ Edit Fee Structure"
                    : "➕ Create Fee Structure"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the fee details below.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >

              {/* Department */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Department
                </label>

                <select
                  value={
                    form.department_id
                  }
                  onChange={(event) =>
                    handleChange(
                      "department_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={
                          department.id
                        }
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Course
                </label>

                <input
                  type="text"
                  value={form.course}
                  onChange={(event) =>
                    handleChange(
                      "course",
                      event.target.value
                    )
                  }
                  placeholder="B.Tech CSE"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Semester
                </label>

                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.semester}
                  onChange={(event) =>
                    handleChange(
                      "semester",
                      event.target.value
                    )
                  }
                  placeholder="7"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Fee Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Fee Type
                </label>

                <input
                  type="text"
                  value={form.fee_type}
                  onChange={(event) =>
                    handleChange(
                      "fee_type",
                      event.target.value
                    )
                  }
                  placeholder="Semester Fee"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Amount (₹)
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    handleChange(
                      "amount",
                      event.target.value
                    )
                  }
                  placeholder="45000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Academic Year
                </label>

                <input
                  type="text"
                  value={
                    form.academic_year
                  }
                  onChange={(event) =>
                    handleChange(
                      "academic_year",
                      event.target.value
                    )
                  }
                  placeholder="2026-27"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Submit */}
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Fee Structure"
                      : "Create Fee Structure"}
                </button>
              </div>

            </form>
          </div>

          {/* ================================================== */}
          {/* EXISTING FEES */}
          {/* ================================================== */}

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Existing Fee Structures
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {fees.length} fee structure
                    {fees.length !== 1
                      ? "s"
                      : ""}{" "}
                    found.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadData}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />

                <p className="mt-4 text-slate-400">
                  Loading fee structures...
                </p>
              </div>
            ) : fees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl">
                  💰
                </div>

                <p className="mt-4 text-slate-400">
                  No fee structures found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">

                  <thead className="bg-slate-950/70">
                    <tr className="border-b border-slate-800">

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Department
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Course
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Semester
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Fee Type
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Academic Year
                      </th>

                      <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {fees.map((fee) => (
                      <tr
                        key={fee.id}
                        className="border-b border-slate-800/70 hover:bg-slate-800/40"
                      >

                        <td className="px-6 py-5 text-sm text-slate-300">
                          {getDepartmentName(
                            fee.department_id
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold">
                            {fee.course}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          Semester{" "}
                          {fee.semester}
                        </td>

                        <td className="px-6 py-5 text-slate-400">
                          {fee.fee_type}
                        </td>

                        <td className="px-6 py-5 font-bold text-emerald-400">
                          ₹
                          {Number(
                            fee.amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-6 py-5 text-slate-400">
                          {fee.academic_year}
                        </td>

                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(fee)
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
                          >
                            ✏️ Edit
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}