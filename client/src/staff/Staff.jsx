import React from "react";
import StaffDashboard from "./dashboard/StaffDashboard";
import "./staff.css";

export default function Staff({ user, run }) {
  return <StaffDashboard key={user.id} user={user} run={run} />;
}
