"use client";

import NoDuesStaffDashboard from "@/components/NoDuesStaffDashboard";

export default function LabDashboard() {
  return (
    <NoDuesStaffDashboard
      role="lab"
      title="Lab Dashboard"
      subtitle="Manage laboratory clearance and student No-Dues requests."
      portalIcon="🧪"
      departmentName="Lab"
      clearanceIcon="🔬"
    />
  );
}