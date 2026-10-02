"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login({
        email,
        password,
      });

      // ==========================================
      // SAVE AUTHENTICATION DATA
      // ==========================================

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // ==========================================
      // ROLE BASED REDIRECT
      // ==========================================

      const role = data.user.role;

      switch (role) {
        case "student":
          router.push("/dashboard/student");
          break;

        case "faculty":
          router.push("/dashboard/faculty");
          break;

        case "hod":
          router.push("/dashboard/hod");
          break;

        case "library":
          router.push("/dashboard/library");
          break;

        case "lab":
          router.push("/dashboard/lab");
          break;

        case "accounts":
          router.push("/dashboard/accounts");
          break;

        case "warden":
          router.push("/dashboard/warden");
          break;

        case "security":
          router.push("/dashboard/security");
          break;

        case "admin":
          router.push("/dashboard/admin");
          break;

        default:
          setError(
            `No dashboard configured for role: ${role}`
          );
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          break;
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      setError(
        error?.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <p className="font-semibold text-blue-400">
            CAMPUS ERP
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome Back
          </h1>

          <p className="mt-2 text-slate-400">
            Login to your campus account
          </p>
        </div>

        {/* LOGIN FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}