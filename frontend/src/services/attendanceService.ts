import api from "@/lib/api";

export interface AttendanceRecord {
  id: number;
  student_id: number;
  subject: string;
  subject_code: string;
  date: string;
  status: "present" | "absent";
  created_at: string;
}

export interface AttendanceListResponse {
  data: AttendanceRecord[];
  total: number;
}

export interface AttendanceSummary {
  subject: string;
  subject_code: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface AttendanceOverall {
  present: number;
  total: number;
  percentage: number;
}

export interface AttendanceSummaryResponse {
  data: AttendanceSummary[];
  overall: AttendanceOverall;
}

export async function getMyAttendance(): Promise<AttendanceListResponse> {
  const response =
    await api.get<AttendanceListResponse>(
      "/api/attendance/me"
    );

  return response.data;
}

export async function getMyAttendanceSummary(): Promise<AttendanceSummaryResponse> {
  const response =
    await api.get<AttendanceSummaryResponse>(
      "/api/attendance/me/summary"
    );

  return response.data;
}