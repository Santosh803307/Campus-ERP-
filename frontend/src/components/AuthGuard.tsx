"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

interface TokenUser {
  id: number;
  email: string;
  role: string;
  exp: number;
}

function getUserFromToken(): TokenUser | null {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      atob(parts[1])
    );

    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      !payload.exp
    ) {
      return null;
    }

    const expiresAt = Number(payload.exp);

    /*
     * JWT exp is in seconds.
     */
    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      id: Number(payload.sub),
      email: String(payload.email),
      role: String(payload.role).toLowerCase(),
      exp: expiresAt,
    };
  } catch {
    return null;
  }
}

export default function AuthGuard({
  children,
  allowedRoles,
}: AuthGuardProps) {
  const {
    loading: authLoading,
  } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [tokenUser, setTokenUser] =
    useState<TokenUser | null>(null);

  useEffect(() => {
    /*
     * Read the latest token directly from localStorage.
     * This prevents stale AuthContext data after
     * switching between Student / Staff / HOD accounts.
     */
    const currentUser = getUserFromToken();

    if (!currentUser) {
      localStorage.removeItem("access_token");
      setTokenUser(null);
    } else {
      setTokenUser(currentUser);
    }

    setChecking(false);

  }, [pathname]);

  useEffect(() => {
    if (authLoading || checking) {
      return;
    }

    /*
     * No valid token
     */
    if (!tokenUser) {
      router.replace("/login");
      return;
    }

    /*
     * Normalize allowed roles
     */
    const normalizedRoles =
      allowedRoles?.map((role) =>
        role.toLowerCase()
      );

    /*
     * Role authorization
     */
    if (
      normalizedRoles &&
      !normalizedRoles.includes(
        tokenUser.role
      )
    ) {
      router.replace("/unauthorized");
    }
  }, [
    authLoading,
    checking,
    tokenUser,
    allowedRoles,
    router,
  ]);

  /*
   * Loading screen
   */
  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="text-sm text-slate-500">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  /*
   * No authentication
   */
  if (!tokenUser) {
    return null;
  }

  /*
   * Unauthorized role
   */
  const normalizedRoles =
    allowedRoles?.map((role) =>
      role.toLowerCase()
    );

  if (
    normalizedRoles &&
    !normalizedRoles.includes(
      tokenUser.role
    )
  ) {
    return null;
  }

  return <>{children}</>;
}