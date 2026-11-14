import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import CustomerApp from "./customer/CustomerApp";
import ClickSparkles from "./components/ClickSparkles";
import ScrollEffects from "./components/ScrollEffects";
import Staff from "./staff/Staff";

createRoot(document.getElementById("root")).render(
  <>
    <ScrollEffects />
    <ClickSparkles />
    <CustomerApp renderStaff={(user, run) => <Staff user={user} run={run} />} />
  </>,
);
