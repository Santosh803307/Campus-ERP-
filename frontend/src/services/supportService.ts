import api from "@/lib/api";

export interface SupportTicket {
  id: number;
  student_id: number;
  department: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketCreate {
  department: string;
  category: string;
  description: string;
}

export interface SupportTicketListResponse {
  data: SupportTicket[];
  total: number;
}

export async function createSupportTicket(
  payload: SupportTicketCreate
): Promise<SupportTicket> {
  const response =
    await api.post<SupportTicket>(
      "/api/support/tickets",
      payload
    );

  return response.data;
}

export async function getMySupportTickets(): Promise<SupportTicketListResponse> {
  const response =
    await api.get<SupportTicketListResponse>(
      "/api/support/my-tickets"
    );

  return response.data;
}