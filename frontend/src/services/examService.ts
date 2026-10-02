import api from "@/lib/api";

export interface Exam {
  id: number;
  subject: string;
  subject_code: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
  semester: number;
  course: string;
  created_at: string;
}

export interface ExamListResponse {
  data: Exam[];
  total: number;
}

export interface ExamCreatePayload {
  subject: string;
  subject_code: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
  semester: number;
  course: string;
}

export type ExamUpdatePayload =
  Partial<ExamCreatePayload>;

export interface ExamFilters {
  search?: string;
  semester?: number;
  course?: string;
  exam_type?: string;
}

/* =========================
   ADMIN
========================= */

export async function getExams(
  filters: ExamFilters = {}
): Promise<ExamListResponse> {
  const response =
    await api.get<ExamListResponse>(
      "/api/exams/",
      {
        params: {
          search:
            filters.search || undefined,
          semester:
            filters.semester || undefined,
          course:
            filters.course || undefined,
          exam_type:
            filters.exam_type || undefined,
        },
      }
    );

  return response.data;
}

export async function createExam(
  payload: ExamCreatePayload
): Promise<Exam> {
  const response =
    await api.post<Exam>(
      "/api/exams/",
      payload
    );

  return response.data;
}

export async function updateExam(
  examId: number,
  payload: ExamUpdatePayload
): Promise<Exam> {
  const response =
    await api.patch<Exam>(
      `/api/exams/${examId}`,
      payload
    );

  return response.data;
}

export async function deleteExam(
  examId: number
): Promise<void> {
  await api.delete(
    `/api/exams/${examId}`
  );
}

/* =========================
   STUDENT
========================= */

export async function getMyExams(): Promise<Exam[]> {
  const response =
    await api.get<Exam[]>(
      "/api/exams/me"
    );

  return response.data;
}