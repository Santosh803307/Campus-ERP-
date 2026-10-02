"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  User,
  getUser,
} from "@/services/userService";

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const userId = Number(params.id);

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
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
    } catch (error: any) {
      console.error(
        "Failed to load user:",
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
          "You are not authorized to view users."
        );
      } else if (
        error?.response?.status === 404
      ) {
        setError("User not found.");
      } else {
        setError(
          "Unable to load user."
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
          Loading user...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
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
              User Details
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/admin/users"
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
            {user.full_name}
          </h2>

          <p className="mt-2 text-slate-400">
            View account and role information.
          </p>
        </div>

        {/* USER INFORMATION */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-6 text-xl font-semibold">
            Account Information
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm text-slate-400">
                User ID
              </p>

              <p className="mt-1 text-lg font-medium">
                #{user.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Full Name
              </p>

              <p className="mt-1 text-lg font-medium">
                {user.full_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Email
              </p>

              <p className="mt-1 text-lg font-medium">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Role
              </p>

              <span className="mt-2 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold uppercase text-blue-400">
                {user.role}
              </span>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Account Status
              </p>

              <span
                className={
                  user.is_active
                    ? "mt-2 inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400"
                    : "mt-2 inline-block rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400"
                }
              >
                {user.is_active
                  ? "ACTIVE"
                  : "INACTIVE"}
              </span>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/admin/users/${user.id}/edit`
                )
              }
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700"
            >
              Edit User
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/admin/users"
                )
              }
              className="rounded-lg border border-slate-700 px-5 py-3 font-medium hover:bg-slate-800"
            >
              Back to Users
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}