import api from "@/lib/api";

export interface Faculty {
  id: number;
  user_id: number;
  department_id: number;
  employee_id: string;
  designation: string;
  qualification: string | null;
  specialization: string | null;
  phone: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateFacultyData {
  user_id: number;
  department_id: number;
  employee_id: string;
  designation: string;
  qualification?: string;
  specialization?: string;
  phone?: string;
  joining_date?: string;
}

export interface UpdateFacultyData {
  department_id?: number;
  employee_id?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  phone?: string;
  joining_date?: string;
  is_active?: boolean;
}

// GET all faculty
export async function getFaculty(): Promise<Faculty[]> {
  const response = await api.get<Faculty[]>(
    "/api/faculty/"
  );

  return response.data;
}

// GET single faculty
export async function getFacultyById(
  facultyId: number
): Promise<Faculty> {
  const response = await api.get<Faculty>(
    `/api/faculty/${facultyId}`
  );

  return response.data;
}

// CREATE faculty
export async function createFaculty(
  data: CreateFacultyData
): Promise<Faculty> {
  const response = await api.post<Faculty>(
    "/api/faculty/",
    data
  );

  return response.data;
}

// UPDATE faculty
export async function updateFaculty(
  facultyId: number,
  data: UpdateFacultyData
): Promise<Faculty> {
  const response = await api.patch<Faculty>(
    `/api/faculty/${facultyId}`,
    data
  );

  return response.data;
}

// DELETE faculty
export async function deleteFaculty(
  facultyId: number
): Promise<void> {
  await api.delete(
    `/api/faculty/${facultyId}`
  );
}