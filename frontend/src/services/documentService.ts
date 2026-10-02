import api from "@/lib/api";

export interface StudentDocument {
  id: number;
  student_id: number;
  document_type: string;
  title: string;
  file_url: string;
  file_name: string;
  status: string;
  issued_at: string;
  created_at: string;
}

export interface StudentDocumentListResponse {
  data: StudentDocument[];
  total: number;
}

export async function getMyDocuments(): Promise<StudentDocumentListResponse> {
  const response =
    await api.get<StudentDocumentListResponse>(
      "/api/documents/me"
    );

  return response.data;
}

export async function getDocumentFile(
  documentId: number
): Promise<Blob> {
  const response = await api.get(
    `/api/documents/${documentId}/file`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}

export async function getAllDocuments(
  studentId?: number,
  documentType?: string
): Promise<StudentDocumentListResponse> {
  const response =
    await api.get<StudentDocumentListResponse>(
      "/api/documents/",
      {
        params: {
          ...(studentId
            ? { student_id: studentId }
            : {}),
          ...(documentType
            ? { document_type: documentType }
            : {}),
        },
      }
    );

  return response.data;
}

export async function uploadDocument(
  studentId: number,
  documentType: string,
  title: string,
  file: File
): Promise<StudentDocument> {
  const formData = new FormData();

  formData.append(
    "student_id",
    String(studentId)
  );

  formData.append(
    "document_type",
    documentType
  );

  formData.append(
    "title",
    title
  );

  formData.append(
    "file",
    file
  );

  const response =
    await api.post<StudentDocument>(
      "/api/documents/upload",
      formData
    );

  return response.data;
}

export async function getAdminDocumentFile(
  documentId: number
): Promise<Blob> {
  const response = await api.get(
    `/api/documents/admin/${documentId}/file`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}

export async function deleteDocument(
  documentId: number
): Promise<void> {
  await api.delete(
    `/api/documents/${documentId}`
  );
}