import api from "@/lib/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/api/auth/login",
    credentials
  );

  return response.data;
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const refreshToken =
    localStorage.getItem("refresh_token");

  try {
    if (refreshToken) {
      await api.post("/api/auth/logout", {
        refresh_token: refreshToken,
      });
    }
  } catch (error) {
    console.error(
      "Backend logout failed:",
      error
    );
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}