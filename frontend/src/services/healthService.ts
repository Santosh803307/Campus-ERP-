import api from "@/lib/api";

export interface HealthResponse {
  status: string;
  message?: string;
  version?: string;
  environment?: string;
  services?: {
    database: string;
    redis: string;
  };
}

export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>("/api/health/");
  return response.data;
}