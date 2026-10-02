import api from "@/lib/api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface UserCreateData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateData {
  full_name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

// GET all active users
export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>(
    "/api/users/"
  );

  return response.data;
}

// GET single user
export async function getUser(
  userId: number
): Promise<User> {
  const response = await api.get<User>(
    `/api/users/${userId}`
  );

  return response.data;
}

// CREATE user
export async function createUser(
  data: UserCreateData
): Promise<User> {
  const response = await api.post<User>(
    "/api/users/",
    data
  );

  return response.data;
}

// UPDATE user
export async function updateUser(
  userId: number,
  data: UserUpdateData
): Promise<User> {
  const response = await api.patch<User>(
    `/api/users/${userId}`,
    data
  );

  return response.data;
}