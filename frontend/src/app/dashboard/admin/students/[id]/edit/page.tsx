"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Student,
  getStudent,
  updateStudent,
} from "@/services/studentService";
import AuthGuard from "@/components/AuthGuard";

import {
  Department,
  getDepartments,
} from "@/services/departmentService";


export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();

  const studentId = Number(params.id);

  const [student, setStudent] =
    useState<Student | null>(null);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // Form states
  const [departmentId, setDepartmentId] =
    useState("");

  const [enrollmentNo, setEnrollmentNo] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [course, setCourse] =
    useState("");

  const [semester, setSemester] =
    useState("");

  const [section, setSection] =
    useState("");

  const [admissionYear, setAdmissionYear] =
    useState("");

  const [isActive, setIsActive] =
    useState(true);

  // =========================
  // LOAD STUDENT
  // =========================

  useEffect(() => {
    if (!studentId || Number.isNaN(studentId)) {
      setError("Invalid student ID.");
      setLoading(false);
      return;
    }

    loadStudent();
  }, [studentId]);

  async function loadStudent() {
    try {
      setLoading(true);
      setError("");

      const data = await getStudent(studentId);

      setStudent(data);

      const departmentData =
        await getDepartments();

      setDepartments(
        departmentData.data.filter(
          (department) =>
            department.is_active
        )
      );

      setDepartmentId(
        String(data.department_id)
      );

      setEnrollmentNo(
        data.enrollment_no
      );

      setPhone(
        data.phone ?? ""
      );

      setCourse(
        data.course
      );

      setSemester(
        String(data.semester)
      );

      setSection(
        data.section ?? ""
      );

      setAdmissionYear(
        String(data.admission_year)
      );

      setIsActive(
        data.is_active
      );
    } catch (error: any) {
      console.error(
        "Failed to load student:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        setError(
          "Session expired. Please login again."
        );
      } else if (
        error?.response?.status === 403
      ) {
        setError(
          "You are not authorized to edit students."
        );
      } else if (
        error?.response?.status === 404
      ) {
        setError(
          "Student not found."
        );
      } else {
        setError(
          "Unable to load student."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // UPDATE STUDENT
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!enrollmentNo.trim()) {
      setError(
        "Enrollment number is required."
      );
      return;
    }

    if (!course.trim()) {
      setError(
        "Course is required."
      );
      return;
    }

    if (!departmentId) {
      setError(
        "Department ID is required."
      );
      return;
    }

    if (!semester) {
      setError(
        "Semester is required."
      );
      return;
    }

    if (!admissionYear) {
      setError(
        "Admission year is required."
      );
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateStudent(
          studentId,
          {
            department_id:
              Number(departmentId),

            enrollment_no:
              enrollmentNo.trim(),

            phone:
              phone.trim() || undefined,

            course:
              course.trim(),

            semester:
              Number(semester),

            section:
              section.trim() || undefined,

            admission_year:
              Number(admissionYear),

            is_active:
              isActive,
          }
        );

      setStudent(updated);

      setSuccess(
        "Student updated successfully."
      );

      // Small delay so user can see success
      setTimeout(() => {
        router.push(
          `/dashboard/admin/students/${studentId}`
        );
      }, 800);
    } catch (error: any) {
      console.error(
        "Failed to update student:",
        error
      );

      if (
        error?.response?.status === 400
      ) {
        setError(
          error?.response?.data?.detail ||
          "Invalid student data."
        );
      } else if (
        error?.response?.status === 401
      ) {
        setError(
          "Session expired. Please login again."
        );
      } else if (
        error?.response?.status === 403
      ) {
        setError(
          "You are not authorized to update this student."
        );
      } else if (
        error?.response?.status === 404
      ) {
        setError(
          "Student not found."
        );
      } else {
        setError(
          "Unable to update student."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // LOADING UI
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6">
          <p className="text-slate-400">
            Loading student...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR WITHOUT STUDENT
  // =========================

  if (!student) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-xl font-bold">
              Edit Student
            </h1>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6">
            <p className="text-red-300">
              {error ||
                "Student not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/students"
                )
              }
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              ← Back to Students
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-950 text-white">

        {/* HEADER */}

        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

            <div>
              <p className="text-sm font-semibold text-blue-400">
                CAMPUS ERP
              </p>

              <h1 className="text-xl font-bold">
                Edit Student
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/students/${studentId}`
                )
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
            >
              ← Back
            </button>

          </div>
        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-5xl px-6 py-8">

          {/* PAGE TITLE */}

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Edit Student Profile
            </h2>

            <p className="mt-2 text-slate-400">
              Update academic and personal
              information of the student.
            </p>
          </div>

          {/* STUDENT IDENTIFICATION */}

          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="mb-4 text-lg font-semibold">
              Student Information
            </h3>

            <div className="grid gap-4 md:grid-cols-3">

              <div>
                <p className="text-sm text-slate-400">
                  Student ID
                </p>

                <p className="mt-1 font-medium">
                  #{student.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  User ID
                </p>

                <p className="mt-1 font-medium">
                  #{student.user_id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Current Status
                </p>

                <p
                  className={
                    isActive
                      ? "mt-1 font-medium text-green-400"
                      : "mt-1 font-medium text-red-400"
                  }
                >
                  {isActive
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-lg border border-green-800 bg-green-950/40 p-4 text-green-300">
              {success}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            <h3 className="mb-6 text-xl font-semibold">
              Academic Information
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* DEPARTMENT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <select
                  value={departmentId}
                  onChange={(e) =>
                    setDepartmentId(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* ENROLLMENT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Enrollment Number
                </label>

                <input
                  type="text"
                  value={enrollmentNo}
                  onChange={(e) =>
                    setEnrollmentNo(
                      e.target.value
                    )}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* COURSE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Course
                </label>

                <input
                  type="text"
                  value={course}
                  onChange={(e) =>
                    setCourse(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* SEMESTER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Semester
                </label>

                <select
                  value={semester}
                  onChange={(e) =>
                    setSemester(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="">
                    Select Semester
                  </option>

                  {Array.from(
                    { length: 12 },
                    (_, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                      >
                        Semester{" "}
                        {index + 1}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SECTION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Section
                </label>

                <input
                  type="text"
                  value={section}
                  onChange={(e) =>
                    setSection(
                      e.target.value
                    )
                  }
                  placeholder="Example: A"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* ADMISSION YEAR */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Admission Year
                </label>

                <input
                  type="number"
                  value={admissionYear}
                  onChange={(e) =>
                    setAdmissionYear(
                      e.target.value
                    )
                  }
                  min="2000"
                  max="2100"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

            </div>

            {/* PERSONAL INFORMATION */}

            <h3 className="mb-6 mt-10 text-xl font-semibold">
              Personal Information
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Student Status
                </label>

                <select
                  value={
                    isActive
                      ? "active"
                      : "inactive"
                  }
                  onChange={(e) =>
                    setIsActive(
                      e.target.value ===
                      "active"
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/admin/students/${studentId}`
                  )
                }
                disabled={saving}
                className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </main>
    </AuthGuard>
  );
}