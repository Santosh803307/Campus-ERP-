"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  User,
  getUser,
  updateUser,
} from "@/services/userService";

const roles = [
  "student",
  "faculty",
  "hod",
  "library",
  "lab",
  "accounts",
  "warden",
  "security",
  "admin",
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();

  const userId = Number(params.id);

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState("");

  const [isActive, setIsActive] =
    useState(true);

  const [password, setPassword] =
    useState("");

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      setError("Invalid user ID.");
      setLoading(false);
      return;
    }

    loadUser();
  }, [userId]);

  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      const data = await getUser(userId);

      setUser(data);
      setFullName(data.full_name);
      setEmail(data.email);
      setRole(data.role);
      setIsActive(data.is_active);
    } catch (error: any) {
      console.error(
        "Failed to load user:",
        error
      );

      if (error?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (error?.response?.status === 403) {
        setError(
          "You are not authorized to edit users."
        );
      } else if (error?.response?.status === 404) {
        setError("User not found.");
      } else {
        setError("Unable to load user.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!role) {
      setError("Role is required.");
      return;
    }

    try {
      setSaving(true);

      const updateData: {
        full_name: string;
        email: string;
        role: string;
        is_active: boolean;
        password?: string;
      } = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        is_active: isActive,
      };

      if (password.trim()) {
        updateData.password =
          password.trim();
      }

      const updated =
        await updateUser(
          userId,
          updateData
        );

      setUser(updated);

      setSuccess(
        "User updated successfully."
      );

      setPassword("");

      setTimeout(() => {
        router.push(
          `/dashboard/admin/users/${userId}`
        );
      }, 800);
    } catch (error: any) {
      console.error(
        "Failed to update user:",
        error
      );

      if (error?.response?.status === 400) {
        setError(
          error?.response?.data?.detail ||
            "Invalid user data."
        );
      } else if (error?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (error?.response?.status === 403) {
        setError(
          "You are not authorized to update this user."
        );
      } else if (error?.response?.status === 404) {
        setError("User not found.");
      } else {
        setError(
          "Unable to update user."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6">
          Loading user...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6">
            <p className="text-red-300">
              {error || "User not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/users"
                )
              }
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              ← Back to Users
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
              Edit User
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/admin/users/${userId}`
              )
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            ← Back
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Edit User Profile
          </h2>

          <p className="mt-2 text-slate-400">
            Update account information,
            role and account status.
          </p>
        </div>

        {/* USER INFO */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-5 text-xl font-semibold">
            User Information
          </h3>

          <div className="grid gap-6 md:grid-cols-3">

            <div>
              <p className="text-sm text-slate-400">
                User ID
              </p>

              <p className="mt-1 font-medium">
                #{user.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Current Role
              </p>

              <p className="mt-1 font-medium uppercase text-blue-400">
                {user.role}
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
            Account Details
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            {/* FULL NAME */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select Role
                </option>

                {roles.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Account Status
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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

          {/* PASSWORD */}

          <div className="mt-8 border-t border-slate-800 pt-8">

            <h3 className="mb-2 text-xl font-semibold">
              Change Password
            </h3>

            <p className="mb-5 text-sm text-slate-500">
              Leave blank if you do not want to
              change the password.
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter new password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500 md:max-w-xl"
            />

          </div>

          {/* BUTTONS */}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/users/${userId}`
                )
              }
              disabled={saving}
              className="rounded-lg border border-slate-700 px-6 py-3 font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}