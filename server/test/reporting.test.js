import { test } from "node:test";
import assert from "node:assert/strict";
import { dashboardData } from "../src/reporting.js";
test("empty hotel metrics stay finite and do not invent historical comparisons", () => {
  const result = dashboardData([], [], [], 7, "2026-11-14");
  assert.equal(result.kpi.occupancyRate, 0);
  assert.equal(result.kpi.adr, 0);
  assert.equal(result.revenue.delta, null);
  assert.equal(result.revenue.series.length, 7);
});
test("cash uses Bangkok dates and ADR counts only overlapping stay nights", () => {
  const result = dashboardData(
    [{ active: 1, status: "Vacant" }],
    [
      {
        id: "test",
        status: "Completed",
        check_in: "2026-11-07",
        check_out: "2026-11-10",
        room_total: 300,
        discount: 0,
        created_at: "2026-11-08 00:00:00",
        paid: 300,
      },
    ],
    [{ amount: 300, paid_at: "2026-11-13 18:00:00" }],
    7,
    "2026-11-14",
  );
  assert.equal(result.revenue.series.at(-1).value, 300);
  assert.equal(result.kpi.adr, 100);
  assert.equal(result.kpi.revpar, 28.57);
});
