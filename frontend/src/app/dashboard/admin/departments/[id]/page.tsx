"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Department,
  getDepartment,
} from "@/services/departmentService";

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const departmentId = Number(params.id);

  const [department, setDepartment] =
    useState<Department | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !departmentId ||
      Number.isNaN(departmentId)
    ) {
      setError("Invalid department ID.");
      setLoading(false);
      return;
    }

    loadDepartment();
  }, [departmentId]);

  async function loadDepartment() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getDepartment(departmentId);

      setDepartment(data);
    } catch (error: any) {
      console.error(
        "Failed to load department:",
        error
      );

      if (error?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (
        error?.response?.status === 403
      ) {
        setError(
          "You are not authorized to view departments."
        );
      } else if (
        error?.response?.status === 404
      ) {
        setError("Department not found.");
      } else {
        setError(
          "Unable to load department."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6">
          <p className="text-slate-400">
            Loading department...
          </p>
        </div>
      </main>
    );
  }

  if (!department) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6">

            <p className="text-red-300">
              {error ||
                "Department not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/departments"
                )
              }
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              ← Back to Departments
            </button>

          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}

      <header className="border-b border-slate-800 bg-slate-900">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-xl font-bold">
              Department Details
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin/departments"
              )
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
          >
            ← Back
          </button>

        </div>

      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            {department.name}
          </h2>

          <p className="mt-2 text-slate-400">
            View department information
            and configuration.
          </p>

        </div>

        {/* DEPARTMENT INFORMATION */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-6 text-xl font-semibold">
            Department Information
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            {/* ID */}

            <div>
              <p className="text-sm text-slate-400">
                Department ID
              </p>

              <p className="mt-1 text-lg font-medium">
                #{department.id}
              </p>
            </div>

            {/* NAME */}

            <div>
              <p className="text-sm text-slate-400">
                Department Name
              </p>

              <p className="mt-1 text-lg font-medium">
                {department.name}
              </p>
            </div>

            {/* CODE */}

            <div>
              <p className="text-sm text-slate-400">
                Department Code
              </p>

              <span className="mt-2 inline-block rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-semibold text-blue-400">
                {department.code}
              </span>
            </div>

            {/* STATUS */}

            <div>
              <p className="text-sm text-slate-400">
                Status
              </p>

              <span
                className={
                  department.is_active
                    ? "mt-2 inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400"
                    : "mt-2 inline-block rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400"
                }
              >
                {department.is_active
                  ? "ACTIVE"
                  : "INACTIVE"}
              </span>
            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-8 border-t border-slate-800 pt-8">

            <p className="text-sm text-slate-400">
              Description
            </p>

            <p className="mt-2 leading-7 text-slate-200">
              {department.description ||
                "No description provided."}
            </p>

          </div>

          {/* CREATED */}

          <div className="mt-6">

            <p className="text-sm text-slate-400">
              Created At
            </p>

            <p className="mt-1 text-slate-200">
              {new Date(
                department.created_at
              ).toLocaleString()}
            </p>

          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/departments/${department.id}/edit`
                )
              }
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700"
            >
              Edit Department
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/departments"
                )
              }
              className="rounded-lg border border-slate-700 px-5 py-3 font-medium transition hover:bg-slate-800"
            >
              Back to Departments
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}