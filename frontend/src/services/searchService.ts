import api from "@/lib/api";

export interface SearchResult {
  type:
    | "student"
    | "user"
    | "fee_structure"
    | "student_fee"
    | "payment"
    | "no_dues"
    | "out_pass";

  id: number;
  title: string;
  subtitle: string;
}

export interface GlobalSearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export async function globalSearch(
  query: string
): Promise<GlobalSearchResponse> {
  const response =
    await api.get<GlobalSearchResponse>(
      "/api/search/",
      {
        params: {
          q: query,
        },
      }
    );

  return response.data;
}