"use client";

import NoDuesStaffDashboard from "@/components/NoDuesStaffDashboard";

export default function AccountsDashboard() {
  return (
    <NoDuesStaffDashboard
      role="accounts"
      title="Accounts Dashboard"
      subtitle="Manage financial clearance and student No-Dues requests."
      portalIcon="💰"
      departmentName="Accounts"
      clearanceIcon="💳"
    />
  );
}