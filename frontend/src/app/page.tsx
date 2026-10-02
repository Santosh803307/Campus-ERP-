"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getHealthStatus,
  HealthResponse,
} from "@/services/healthService";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getHealthStatus();
        setHealth(data);
      } catch (err) {
        console.error(err);
        setError("Backend connection failed");
      } finally {
        setLoading(false);
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="w-full max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <p className="text-blue-400 font-semibold tracking-wide">
              CAMPUS ERP
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Administration & Operational Services
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Login
          </Link>
        </header>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Administration & Operational Services
          </h1>

          <p className="text-slate-400 mt-4 text-lg max-w-2xl">
            Smart, scalable and paperless campus management platform.
          </p>
        </div>

        {/* System Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">
            System Status
          </h2>

          {loading && (
            <p className="text-yellow-400">
              Checking backend...
            </p>
          )}

          {error && (
            <p className="text-red-400">
              {error}
            </p>
          )}

          {health && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>API</span>
                <span className="text-green-400">
                  ● Online
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="text-green-400">
                  ● {health.services.database}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Redis</span>
                <span className="text-green-400">
                  ● {health.services.redis}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>API Version</span>
                <span>{health.version}</span>
              </div>
            </div>
          )}
        </div>

        {/* Login CTA */}
        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
          <h2 className="text-xl font-semibold">
            Access your Campus ERP
          </h2>

          <p className="text-slate-400 mt-2 mb-5">
            Students, faculty and administrators can access
            their respective dashboards.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Login →
          </Link>
        </div>

      </div>
    </main>
  );
}