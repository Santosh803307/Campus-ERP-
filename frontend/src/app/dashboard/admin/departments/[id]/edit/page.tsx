"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getDepartment,
  updateDepartment,
  Department,
} from "@/services/departmentService";

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();

  const departmentId = Number(params.id);

  const [department, setDepartment] =
    useState<Department | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DEPARTMENT
  // =====================================================

  useEffect(() => {
    async function loadDepartment() {
      try {
        setLoading(true);
        setError("");

        const data = await getDepartment(departmentId);

        setDepartment(data);
        setName(data.name);
        setCode(data.code);
        setDescription(data.description ?? "");
        setIsActive(data.is_active);
      } catch (err) {
        console.error(err);
        setError("Failed to load department.");
      } finally {
        setLoading(false);
      }
    }

    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId]);

  // =====================================================
  // SAVE CHANGES
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await updateDepartment(departmentId, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        is_active: isActive,
      });

      router.push(
        `/dashboard/admin/departments/${departmentId}`
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update department.");
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-400">
            Loading department...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!department) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">
            Department not found
          </h1>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin/departments"
              )
            }
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            Back to Departments
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Edit Department
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/admin/departments/${departmentId}`
              )
            }
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-4xl font-bold">
            Edit Department Profile
          </h2>

          <p className="mt-2 text-slate-400">
            Update department information and configuration.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          {/* DEPARTMENT INFORMATION */}

          <div>
            <h3 className="text-2xl font-bold">
              Department Information
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Update the basic department information.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Department Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                maxLength={100}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="Computer Science Engineering"
              />
            </div>

            {/* CODE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Department Code
              </label>

              <input
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase())
                }
                required
                maxLength={20}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white uppercase outline-none transition focus:border-blue-500"
                placeholder="CSE"
              />
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={5}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="Department of Computer Science and Engineering"
            />
          </div>

          {/* STATUS */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Department Status
            </label>

            <select
              value={isActive ? "active" : "inactive"}
              onChange={(event) =>
                setIsActive(
                  event.target.value === "active"
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500 md:max-w-md"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/departments/${departmentId}`
                )
              }
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}