import api from "@/lib/api";

export interface NoDuesApplyRequest {
  reason?: string;
}

export interface NoDuesRequest {
  id: number;
  student_id: number;
  status: string;
  reason?: string | null;
  applied_at: string;
  completed_at?: string | null;
}

export interface NoDuesApproval {
  id: number;
  no_dues_request_id: number;
  department: string;
  status: string;
  remarks?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
}

export interface MyNoDuesResponse {
  request: NoDuesRequest;
  approvals: NoDuesApproval[];
}

export interface PendingNoDues {
  request_id: number;
  approval_id: number;
  student_id?: number | null;
  student_name?: string | null;
  enrollment_no?: string | null;
  department: string;
  status: string;
  reason?: string | null;
  applied_at: string;
}

export interface ApprovalUpdate {
  status: "approved" | "rejected";
  remarks?: string;
}


// Apply for No-Dues
export async function applyForNoDues(
  data: NoDuesApplyRequest
): Promise<NoDuesRequest> {
  const response = await api.post<NoDuesRequest>(
    "/api/no-dues/apply",
    data
  );

  return response.data;
}


// Get student's No-Dues request
export async function getMyNoDues(): Promise<MyNoDuesResponse> {
  const response = await api.get<MyNoDuesResponse>(
    "/api/no-dues/my-request"
  );

  return response.data;
}


// Get single No-Dues request
export async function getNoDuesRequest(
  requestId: number
) {
  const response = await api.get(
    `/api/no-dues/${requestId}`
  );

  return response.data;
}


// Get pending requests for department
export async function getPendingNoDues(): Promise<
  PendingNoDues[]
> {
  const response = await api.get<PendingNoDues[]>(
    "/api/no-dues/pending/list"
  );

  return response.data;
}


// Approve / Reject No-Dues
export async function updateNoDuesApproval(
  requestId: number,
  data: ApprovalUpdate
) {
  const response = await api.patch(
    `/api/no-dues/${requestId}/approval`,
    data
  );

  return response.data;
}


// Admin - all requests
export async function getAllNoDues() {
  const response = await api.get(
    "/api/no-dues/"
  );

  return response.data;
}
export async function downloadNoDuesCertificate(
  requestId: number
): Promise<Blob> {
  const response = await api.get(
    `/api/no-dues/${requestId}/certificate`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}