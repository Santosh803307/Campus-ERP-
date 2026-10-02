import api from "@/lib/api";

export interface Student {
  id: number;
  user_id: number;
  department_id: number;
  enrollment_no: string;
  phone?: string | null;
  course: string;
  semester: number;
  section?: string | null;
  admission_year: number;
  is_active: boolean;
  created_at: string;

  full_name: string;
  email: string;
  department_name: string;
  department_code: string;
}


export interface StudentCreate {
  full_name: string;
  email: string;
  password: string;

  department_id: number;
  enrollment_no: string;
  phone?: string;
  course: string;
  semester: number;
  section?: string;
  admission_year: number;
}

export interface StudentUpdate {
  department_id?: number;
  enrollment_no?: string;
  phone?: string;
  course?: string;
  semester?: number;
  section?: string;
  admission_year?: number;
  is_active?: boolean;
}

// =========================================================
// STUDENT LIST QUERY
// =========================================================

export interface StudentPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface StudentListResponse {
  data: Student[];
  pagination: StudentPagination;
}

export interface StudentQuery {
  search?: string;
  department_id?: number;
  semester?: number;
  section?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface StudentSearchResult {
  id: number;
  enrollment_no: string;
  full_name: string;
  email: string;
  course: string;
  semester: number;
  section?: string | null;
  is_active: boolean;
}


// Get students with search, filters and pagination
export async function getStudents(
  options: StudentQuery = {}
): Promise<StudentListResponse> {
  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set(
      "search",
      options.search.trim()
    );
  }

  if (options.department_id !== undefined) {
    params.set(
      "department_id",
      String(options.department_id)
    );
  }

  if (options.semester !== undefined) {
    params.set(
      "semester",
      String(options.semester)
    );
  }

  if (options.section?.trim()) {
    params.set(
      "section",
      options.section.trim()
    );
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
    await api.get<StudentListResponse>(
      `/api/students/?${params.toString()}`
    );

  return response.data;
}

// Get single student
export async function getStudent(
  studentId: number
): Promise<Student> {
  const response = await api.get<Student>(
    `/api/students/${studentId}`
  );

  return response.data;
}

// Create student
export async function createStudent(
  data: StudentCreate
): Promise<Student> {
  const response = await api.post<Student>(
    "/api/students/",
    data
  );

  return response.data;
}

// Update student
export async function updateStudent(
  studentId: number,
  data: StudentUpdate
): Promise<Student> {
  const response = await api.patch<Student>(
    `/api/students/${studentId}`,
    data
  );

  return response.data;
}

// Delete student
export async function deleteStudent(
  studentId: number
): Promise<void> {
  await api.delete(
    `/api/students/${studentId}`
  );
}

// Activate / Deactivate student
export async function setStudentStatus(
  studentId: number,
  isActive: boolean
): Promise<Student> {
  return updateStudent(studentId, {
    is_active: isActive,
  });
}

export async function getMyStudentProfile(): Promise<Student> {
  const response = await api.get<Student>(
    "/api/students/me"
  );

  return response.data;
}

// Search students for result/document management
export async function searchStudents(
  search: string
): Promise<StudentSearchResult[]> {
  const searchValue = search.trim();

  if (!searchValue) {
    return [];
  }

  const response =
    await api.get<StudentSearchResult[]>(
      "/api/students/search",
      {
        params: {
          search: searchValue,
        },
      }
    );

  return response.data;
}