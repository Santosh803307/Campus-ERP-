"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { logout as logoutService } from "@/services/authService";

type UserRole =
  | "student"
  | "faculty"
  | "hod"
  | "library"
  | "lab"
  | "accounts"
  | "warden"
  | "security"
  | "admin";

interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

function getUserFromToken(
  token: string
): AuthUser | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    if (
      !payload.sub ||
      !payload.email ||
      !payload.role
    ) {
      return null;
    }

    return {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    null
  );

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const savedToken =
      localStorage.getItem("access_token");

    if (savedToken) {
      const decodedUser =
        getUserFromToken(savedToken);

      if (decodedUser) {
        setToken(savedToken);
        setUser(decodedUser);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // ------------------------------------------------------
  // Logout
  // ------------------------------------------------------

  async function logout() {
    try {
      // Call backend logout
      // This revokes the refresh token in database.
      await logoutService();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      // Clear React state
      setToken(null);
      setUser(null);

      // Clear local storage
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      localStorage.removeItem(
        "user"
      );

      // Redirect to login
      window.location.href = "/";
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated:
          !!user && !!token,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}