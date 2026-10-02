"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createStudent,
  StudentCreate,
} from "@/services/studentService";

import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export default function CreateStudentPage() {
  const router = useRouter();

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [form, setForm] =
    useState<StudentCreate>({
      full_name: "",
      email: "",
      password: "",

      department_id: 0,
      enrollment_no: "",
      phone: "",
      course: "",
      semester: 1,
      section: "",
      admission_year:
        new Date().getFullYear(),
    });

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    try {
      setLoadingData(true);
      setError("");

      const response =
        await api.get<{
          data: Department[];
          total: number;
          page: number;
          limit: number;
        }>("/api/departments/");

      setDepartments(
        response.data.data.filter(
          (department) =>
            department.is_active
        )
      );
    } catch (error: any) {
      console.error(
        "Failed to load departments:",
        error
      );

      setError(
        error?.response?.data?.detail ||
        "Unable to load departments."
      );
    } finally {
      setLoadingData(false);
    }
  }

  function handleChange(
    field: keyof StudentCreate,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]:
        field === "department_id" ||
          field === "semester" ||
          field === "admission_year"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ----------------------------------------
    // Account validation
    // ----------------------------------------

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (form.full_name.trim().length < 2) {
      setError(
        "Full name must contain at least 2 characters."
      );
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    // ----------------------------------------
    // Academic validation
    // ----------------------------------------

    if (!form.department_id) {
      setError(
        "Please select a department."
      );
      return;
    }

    if (!form.enrollment_no.trim()) {
      setError(
        "Enrollment number is required."
      );
      return;
    }

    if (!form.course.trim()) {
      setError("Course is required.");
      return;
    }

    if (
      form.semester < 1 ||
      form.semester > 12
    ) {
      setError(
        "Semester must be between 1 and 12."
      );
      return;
    }

    if (
      form.admission_year < 2000 ||
      form.admission_year > 2100
    ) {
      setError(
        "Please enter a valid admission year."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: StudentCreate = {
        full_name:
          form.full_name.trim(),

        email:
          form.email.trim().toLowerCase(),

        password:
          form.password,

        department_id:
          form.department_id,

        enrollment_no:
          form.enrollment_no.trim(),

        phone:
          form.phone?.trim() || undefined,

        course:
          form.course.trim(),

        semester:
          form.semester,

        section:
          form.section?.trim() || undefined,

        admission_year:
          form.admission_year,
      };

      await createStudent(payload);

      setSuccess(
        "Student account and profile created successfully!"
      );

      setTimeout(() => {
        router.push(
          "/dashboard/admin/students"
        );
      }, 1000);
    } catch (error: any) {
      console.error(
        "Failed to create student:",
        error?.response?.data || error
      );

      const detail =
        error?.response?.data?.detail;

      // FastAPI validation errors
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item: any) => {
            const field = Array.isArray(item.loc)
              ? item.loc[item.loc.length - 1]
              : "field";

            return `${field}: ${item.msg}`;
          })
          .join(" | ");

        setError(messages);
      }

      // Normal backend error
      else if (typeof detail === "string") {
        setError(detail);
      }

      // Unknown error
      else {
        setError(
          "Unable to create student. Please check the entered details."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading student form...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-xl font-bold">
              Add Student
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin/students"
              )
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
          >
            ← Students
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Create Student Profile
          </h2>

          <p className="mt-2 text-slate-400">
            Create a student login account and
            assign academic information.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-800 bg-green-950/40 p-4 text-sm text-green-300">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* ================================== */}
            {/* ACCOUNT INFORMATION */}
            {/* ================================== */}

            <section>
              <h3 className="mb-4 text-lg font-semibold">
                Account Information
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(event) =>
                      handleChange(
                        "full_name",
                        event.target.value
                      )
                    }
                    placeholder="Aman Kumar"
                    autoComplete="name"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      handleChange(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="aman@campuserp.com"
                    autoComplete="email"
                    maxLength={255}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Login Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      onChange={(event) =>
                        handleChange(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-24 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    This password will be used by
                    the student to log in to Campus
                    ERP.
                  </p>
                </div>
              </div>
            </section>

            {/* ================================== */}
            {/* ACADEMIC INFORMATION */}
            {/* ================================== */}

            <section>
              <h3 className="mb-4 text-lg font-semibold">
                Academic Information
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Department */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
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
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value={0}>
                      Select department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name} (
                          {department.code})
                        </option>
                      )
                    )}
                  </select>

                  {departments.length ===
                    0 && (
                      <p className="mt-2 text-sm text-yellow-400">
                        No active departments are
                        available.
                      </p>
                    )}
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Enrollment Number
                  </label>

                  <input
                    type="text"
                    value={
                      form.enrollment_no
                    }
                    onChange={(event) =>
                      handleChange(
                        "enrollment_no",
                        event.target.value
                      )
                    }
                    placeholder="CSE2026003"
                    maxLength={50}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
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
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Semester */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Semester
                  </label>

                  <select
                    value={form.semester}
                    onChange={(event) =>
                      handleChange(
                        "semester",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    {Array.from(
                      { length: 12 },
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
                </div>

                {/* Section */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Section
                  </label>

                  <input
                    type="text"
                    value={
                      form.section || ""
                    }
                    onChange={(event) =>
                      handleChange(
                        "section",
                        event.target.value
                      )
                    }
                    placeholder="A"
                    maxLength={20}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* Admission Year */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Admission Year
                  </label>

                  <input
                    type="number"
                    value={
                      form.admission_year
                    }
                    onChange={(event) =>
                      handleChange(
                        "admission_year",
                        event.target.value
                      )
                    }
                    min={2000}
                    max={2100}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* ================================== */}
            {/* CONTACT INFORMATION */}
            {/* ================================== */}

            <section>
              <h3 className="mb-4 text-lg font-semibold">
                Contact Information
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={form.phone || ""}
                  onChange={(event) =>
                    handleChange(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="9876543210"
                  maxLength={20}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </section>

            {/* ================================== */}
            {/* BUTTONS */}
            {/* ================================== */}

            <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/admin/students"
                  )
                }
                disabled={submitting}
                className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  departments.length === 0
                }
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Creating Student..."
                  : "Create Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}