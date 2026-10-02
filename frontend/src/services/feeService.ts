import api from "@/lib/api";

export interface FeeStructure {
  id: number;
  department_id: number;
  course: string;
  semester: number;
  fee_type: string;
  amount: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentFee {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount: string;
  paid_amount: string;
  due_date: string | null;
  status: string;
  created_at: string;
}

export async function getFeeStructures() {
  const response = await api.get<FeeStructure[]>(
    "/api/fees/structures"
  );

  return response.data;
}

export async function getMyFees() {
  const response = await api.get<StudentFee[]>(
    "/api/fees/my-fees"
  );

  return response.data;
}

export interface AssignFeePayload {
  student_id: number;
  fee_structure_id: number;
  amount: number;
  due_date?: string | null;
}

export async function assignFee(
  data: AssignFeePayload
) {
  const response =
    await api.post<StudentFee>(
      "/api/fees/assign",
      data
    );

  return response.data;
}