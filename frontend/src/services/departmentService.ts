import api from "@/lib/api";

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DepartmentListResponse {
  data: Department[];
  pagination: DepartmentPagination;
}

export interface DepartmentQuery {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

// GET departments with search, filter and pagination
export async function getDepartments(
  options: DepartmentQuery = {}
): Promise<DepartmentListResponse> {
  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  if (options.is_active !== undefined) {
    params.set(
      "is_active",
      String(options.is_active)
    );
  }

  params.set(
    "page",
    String(options.page ?? 1)
  );

  params.set(
    "limit",
    String(options.limit ?? 20)
  );

  const response =
    await api.get<DepartmentListResponse>(
      `/api/departments/?${params.toString()}`
    );

  return response.data;
}

// GET single department
export async function getDepartment(
  departmentId: number
): Promise<Department> {
  const response =
    await api.get<Department>(
      `/api/departments/${departmentId}`
    );

  return response.data;
}

// CREATE department
export async function createDepartment(
  data: CreateDepartmentData
): Promise<Department> {
  const response =
    await api.post<Department>(
      "/api/departments/",
      data
    );

  return response.data;
}

// UPDATE department
export async function updateDepartment(
  departmentId: number,
  data: UpdateDepartmentData
): Promise<Department> {
  const response =
    await api.patch<Department>(
      `/api/departments/${departmentId}`,
      data
    );

  return response.data;
}

// DELETE department
export async function deleteDepartment(
  departmentId: number
): Promise<void> {
  await api.delete(
    `/api/departments/${departmentId}`
  );
}