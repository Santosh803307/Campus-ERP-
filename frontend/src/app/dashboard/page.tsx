"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "student":
        router.replace("/dashboard/student");
        break;

      case "admin":
        router.replace("/dashboard/admin");
        break;

      case "faculty":
        router.replace("/dashboard/hod");
        break;

      case "hod":
        router.replace("/dashboard/hod");
        break;

      case "library":
        router.replace("/dashboard/library");
        break;

      case "lab":
        router.replace("/dashboard/lab");
        break;

      case "accounts":
        router.replace("/dashboard/accounts");
        break;

      case "warden":
        router.replace("/dashboard/warden");
        break;

      case "security":
        router.replace("/dashboard/security");
        break;

      default:
        router.replace("/unauthorized");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      Loading dashboard...
    </div>
  );
}