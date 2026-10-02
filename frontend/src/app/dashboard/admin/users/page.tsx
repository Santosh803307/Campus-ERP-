"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

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

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<CreateUserData>({
    full_name: "",
    email: "",
    password: "",
    role: "student",
  });

  // =====================================================
  // LOAD USERS
  // =====================================================

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<User[]>("/api/users/");

      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to load users:", err);

      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err?.response?.status === 403) {
        setError("You are not authorized to view users.");
      } else {
        setError("Unable to load users.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        user.full_name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  // =====================================================
  // CREATE USER
  // =====================================================

  async function handleCreateUser(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setCreating(true);

      await api.post("/api/users/", {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      setSuccess("User created successfully.");

      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "student",
      });

      setShowCreate(false);

      await loadUsers();
    } catch (err: any) {
      console.error("Failed to create user:", err);

      if (err?.response?.status === 400) {
        setError(
          err?.response?.data?.detail ||
            "Unable to create user."
        );
      } else if (err?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (err?.response?.status === 403) {
        setError(
          "Only administrators can create users."
        );
      } else {
        setError("Unable to create user.");
      }
    } finally {
      setCreating(false);
    }
  }

  // =====================================================
  // COUNTS
  // =====================================================

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers = users.filter(
    (user) => !user.is_active
  ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-sm font-semibold text-blue-400">
              CAMPUS ERP
            </p>

            <h1 className="text-2xl font-bold">
              User Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage all ERP user accounts and roles.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/admin")
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowCreate(true);
              }}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold transition hover:bg-blue-700"
            >
              + Create User
            </button>

          </div>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-800 bg-green-950/40 p-4 text-green-300">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-blue-500/20 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold">
              {users.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Active Users
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {activeUsers}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Inactive Users
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {inactiveUsers}
            </p>
          </div>

        </div>

        {/* FILTERS */}

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="grid gap-4 md:grid-cols-3">

            {/* SEARCH */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search Users
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Name or email..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </label>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="all">
                  All Roles
                </option>

                {roles.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="all">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

          </div>

          <div className="mt-4 flex justify-end">

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Reset Filters
            </button>

          </div>

        </div>

        {/* USERS TABLE */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

            <div>
              <h2 className="text-xl font-bold">
                User Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredUsers.length} users
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
            >
              ↻ Refresh
            </button>

          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-950">

                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4">
                      Role
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      User ID
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-800/40"
                    >

                      <td className="px-6 py-5">

                        <div className="font-semibold">
                          {user.full_name}
                        </div>

                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {user.email}
                      </td>

                      <td className="px-6 py-5">

                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase text-blue-400">
                          {user.role}
                        </span>

                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={
                            user.is_active
                              ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400"
                              : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                          }
                        >
                          {user.is_active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        #{user.id}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* CREATE USER MODAL */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Create User
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Create a new ERP account.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleCreateUser}
              className="mt-6 space-y-5"
            >

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      full_name:
                        event.target.value,
                    })
                  }
                  placeholder="Enter full name"
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
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email:
                        event.target.value,
                    })
                  }
                  placeholder="user@example.com"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password:
                        event.target.value,
                    })
                  }
                  placeholder="Minimum 8 characters"
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
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {roles.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={creating}
                  className="rounded-lg border border-slate-700 px-5 py-3 font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}