import api from "@/lib/api";

export interface Notice {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  department: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface NoticeListResponse {
  data: Notice[];
  total: number;
}

export interface NoticeCreate {
  title: string;
  description: string;
  category: string;
  priority: string;
  department: string;
}

export interface NoticeUpdate {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  department?: string;
}

export async function getMyNotices(): Promise<NoticeListResponse> {
  const response =
    await api.get<NoticeListResponse>(
      "/api/notices/me"
    );

  return response.data;
}

export async function getAllNotices(): Promise<NoticeListResponse> {
  const response =
    await api.get<NoticeListResponse>(
      "/api/notices/"
    );

  return response.data;
}

export async function createNotice(
  data: NoticeCreate
): Promise<Notice> {
  const response =
    await api.post<Notice>(
      "/api/notices/",
      data
    );

  return response.data;
}

export async function updateNotice(
  noticeId: number,
  data: NoticeUpdate
): Promise<Notice> {
  const response =
    await api.put<Notice>(
      `/api/notices/${noticeId}`,
      data
    );

  return response.data;
}

export async function deleteNotice(
  noticeId: number
): Promise<void> {
  await api.delete(
    `/api/notices/${noticeId}`
  );
}