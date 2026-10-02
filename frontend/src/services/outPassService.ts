import api from "@/lib/api";

// =========================================================
// OUT-PASS
// =========================================================

export interface OutPass {
  id: number;
  student_id: number;

  reason: string;
  destination: string;
  emergency_contact: string;

  departure_time: string;
  expected_return_time: string;

  status: string;

  approved_by: number | null;
  approved_at: string | null;

  rejected_reason: string | null;

  qr_token: string | null;

  created_at: string;
}

// =========================================================
// CREATE OUT-PASS REQUEST
// =========================================================

export interface CreateOutPassRequest {
  reason: string;
  destination: string;
  emergency_contact: string;
  departure_time: string;
  expected_return_time: string;
}

// =========================================================
// SCAN RESPONSE
// =========================================================

export interface OutPassScanResponse {
  success: boolean;
  message: string;

  out_pass_id: number;

  scan_type: "exit" | "entry";

  scanned_at: string;
}

// =========================================================
// SCAN LOG
// =========================================================

export interface OutPassScanLog {
  id: number;

  out_pass_id: number;

  scanned_by: number | null;

  scan_type: "exit" | "entry";

  scanned_at: string;

  remarks: string | null;
}

// =========================================================
// STUDENT VERIFICATION
// =========================================================

export interface OutPassStudentInfo {
  id: number;
  user_id: number;

  name: string;
  email: string;

  enrollment_no: string;
  course: string;
  semester: number;

  department_id: number;
}

export interface OutPassLatestScan {
  scan_type: string;

  scanned_at: string;

  scanned_by: number | null;

  remarks: string | null;
}

export interface OutPassVerification {
  out_pass_id: number;

  status: string;

  reason: string;
  destination: string;
  emergency_contact: string;

  departure_time: string;
  expected_return_time: string;

  approved_by: number | null;
  approved_at: string | null;

  student: OutPassStudentInfo;

  latest_scan: OutPassLatestScan | null;
}

// =========================================================
// RECENT SECURITY SCAN
// =========================================================

export interface RecentSecurityScan {
  scan_id: number;

  out_pass_id: number;

  student_id: number;

  student_name: string;
  student_email: string;

  enrollment_no: string;

  course: string;
  semester: number;

  destination: string;

  scan_type: "exit" | "entry";

  scanned_at: string;

  scanned_by: number | null;

  remarks: string | null;
}

// =========================================================
// GET MY OUT-PASSES
// Student
// =========================================================

export async function getMyOutPasses(): Promise<OutPass[]> {
  const response = await api.get<OutPass[]>(
    "/api/out-pass/my"
  );

  return response.data;
}

// =========================================================
// APPLY FOR NEW OUT-PASS
// Student
// =========================================================

export async function applyOutPass(
  data: CreateOutPassRequest
): Promise<OutPass> {
  const response = await api.post<OutPass>(
    "/api/out-pass/apply",
    data
  );

  return response.data;
}

// =========================================================
// GET SINGLE OUT-PASS
// Student / Warden / Security / Admin
// =========================================================

export async function getOutPass(
  outPassId: number
): Promise<OutPass> {
  const response = await api.get<OutPass>(
    `/api/out-pass/${outPassId}`
  );

  return response.data;
}

// =========================================================
// GET OUT-PASS QR
// Student / Warden / Security / Admin
// =========================================================

export async function getOutPassQR(
  outPassId: number
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/api/out-pass/${outPassId}/qr`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}

// =========================================================
// SECURITY — SCAN OUT-PASS
// EXIT / ENTRY
// =========================================================

export async function scanOutPass(
  qrToken: string,
  scanType: "exit" | "entry"
): Promise<OutPassScanResponse> {
  const response =
    await api.post<OutPassScanResponse>(
      "/api/out-pass/scan",
      {
        qr_token: qrToken,
        scan_type: scanType,
      }
    );

  return response.data;
}

// =========================================================
// GET OUT-PASS SCAN LOGS
// Student / Security / Warden / Admin
// =========================================================

export async function getOutPassScanLogs(
  outPassId: number
): Promise<OutPassScanLog[]> {
  const response =
    await api.get<OutPassScanLog[]>(
      `/api/out-pass/scan/logs/${outPassId}`
    );

  return response.data;
}

// =========================================================
// VERIFY OUT-PASS
// Security / Warden / Admin / Student (own)
// =========================================================

export async function verifyOutPass(
  outPassId: number
): Promise<OutPassVerification> {
  const response =
    await api.get<OutPassVerification>(
      `/api/out-pass/${outPassId}/verify`
    );

  return response.data;
}

// =========================================================
// GET RECENT SECURITY SCANS
// Security / Admin
// =========================================================

export async function getRecentSecurityScans(
  limit = 20
): Promise<RecentSecurityScan[]> {
  const response =
    await api.get<RecentSecurityScan[]>(
      "/api/out-pass/scan/recent",
      {
        params: {
          limit,
        },
      }
    );

  return response.data;
}