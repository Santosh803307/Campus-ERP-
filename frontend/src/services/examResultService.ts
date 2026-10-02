import api from "@/lib/api";

export interface ExamResult {
  id: number;
  exam_id: number;
  student_id: number;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  result_status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentExamResult
  extends ExamResult {
  subject: string;
  subject_code: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
}

export interface ExamResultListResponse {
  data: ExamResult[];
  total: number;
}

export interface ExamResultCreatePayload {
  exam_id: number;
  student_id: number;
  marks_obtained: number;
  max_marks: number;
  remarks?: string;
}

export interface ExamResultUpdatePayload {
  marks_obtained?: number;
  max_marks?: number;
  remarks?: string;
}

/* =========================
   ADMIN
========================= */

export async function getExamResults(
  examId?: number,
  studentId?: number
): Promise<ExamResultListResponse> {
  const response =
    await api.get<ExamResultListResponse>(
      "/api/exam-results/",
      {
        params: {
          exam_id:
            examId || undefined,
          student_id:
            studentId || undefined,
        },
      }
    );

  return response.data;
}

export async function createExamResult(
  payload: ExamResultCreatePayload
): Promise<ExamResult> {
  const response =
    await api.post<ExamResult>(
      "/api/exam-results/",
      payload
    );

  return response.data;
}

export async function updateExamResult(
  resultId: number,
  payload: ExamResultUpdatePayload
): Promise<ExamResult> {
  const response =
    await api.patch<ExamResult>(
      `/api/exam-results/${resultId}`,
      payload
    );

  return response.data;
}

export async function deleteExamResult(
  resultId: number
): Promise<void> {
  await api.delete(
    `/api/exam-results/${resultId}`
  );
}

/* =========================
   STUDENT
========================= */

export interface StudentExamResultListResponse {
  data: StudentExamResult[];
  total: number;
}

export async function getMyExamResults(): Promise<
  StudentExamResultListResponse
> {
  const response =
    await api.get<StudentExamResultListResponse>(
      "/api/exam-results/me"
    );

  return response.data;
}