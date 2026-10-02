"use client";

import NoDuesStaffDashboard from "@/components/NoDuesStaffDashboard";

export default function HodDashboard() {
  return (
    <NoDuesStaffDashboard
      role="hod"
      title="HOD Dashboard"
      subtitle="Manage academic department clearance and student No-Dues requests."
      portalIcon="🏫"
      departmentName="Department"
      clearanceIcon="🎓"
    />
  );
}