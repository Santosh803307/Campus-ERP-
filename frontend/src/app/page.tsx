"use client";

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
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-blue-400 font-semibold">CAMPUS ERP</p>

          <h1 className="text-4xl md:text-6xl font-bold mt-2">
            Administration & Operational Services
          </h1>

          <p className="text-slate-400 mt-4 text-lg">
            Smart, scalable and paperless campus management platform.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
              <div className="flex justify-between">
                <span>API</span>
                <span className="text-green-400">● Online</span>
              </div>

              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-green-400">
                  ● {health.services.database}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Redis</span>
                <span className="text-green-400">
                  ● {health.services.redis}
                </span>
              </div>

              <div className="flex justify-between">
                <span>API Version</span>
                <span>{health.version}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
