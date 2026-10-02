"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-400">
          🔒
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          Access Denied
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          You do not have permission to access this page.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
        >
          Back to Home
        </Link>

      </div>
    </main>
  );
}