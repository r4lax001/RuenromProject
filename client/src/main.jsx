import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import CustomerApp from "./customer/CustomerApp";
import Staff from "./staff/Staff";

createRoot(document.getElementById("root")).render(
  <CustomerApp renderStaff={(user, run) => <Staff user={user} run={run} />} />,
);
