import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filtersFromQuery,
  isDate,
  stayError,
} from "../src/customer/lib/stay.js";
import { parseFavorites } from "../src/customer/lib/favorites.js";
import { api } from "../src/customer/lib/api.js";

const today = "2026-11-13";
test("invalid or cleared dates are rejected without Date formatting errors", () => {
  for (const value of ["", null, "bad", "2026-02-30", "2026-2-3"])
    assert.equal(isDate(value), false);
  assert.equal(isDate("2028-02-29"), true);
  assert.ok(stayError({ checkIn: today, checkOut: "", guests: 2 }, today));
});
test("invalid URL dates and guests recover to a valid stay", () => {
  const result = filtersFromQuery(
    new URLSearchParams(
      "checkIn=bad&checkOut=2020-01-01&guests=-3&type=Unknown",
    ),
    today,
  );
  assert.deepEqual(result, {
    checkIn: today,
    checkOut: "2026-11-14",
    guests: 2,
    type: "",
  });
  assert.equal(stayError(result, today), "");
});
test("valid deep links keep room type, dates and guests", () => {
  const params = new URLSearchParams(
    "checkIn=2026-12-30&checkOut=2027-01-02&guests=4&type=Suite",
  );
  assert.deepEqual(filtersFromQuery(params, today), {
    checkIn: "2026-12-30",
    checkOut: "2027-01-02",
    guests: 4,
    type: "Suite",
  });
});
test("stay limits reject zero nights, reversed dates, overlong stays and fractional guests", () => {
  const valid = { checkIn: today, checkOut: "2026-11-14", guests: 2 };
  for (const patch of [
    { checkOut: today },
    { checkOut: "2026-11-12" },
    { checkOut: "2027-11-14" },
    { guests: 1.5 },
    { guests: 5 },
  ])
    assert.ok(stayError({ ...valid, ...patch }, today));
  assert.equal(stayError({ ...valid, checkOut: "2027-11-13" }, today), "");
});
test("corrupt favorite storage cannot break cards", () => {
  for (const raw of ["null", "{}", '"classic"', "bad", null])
    assert.deepEqual(parseFavorites(raw), []);
  assert.deepEqual(
    parseFavorites('["classic","classic",null,"suite","untrusted"]'),
    ["classic", "suite"],
  );
});
test("API translates non-JSON proxy failures into useful feedback", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>502</html>", { status: 502 }),
  );
  await assert.rejects(api("/rooms"), /ระบบยังไม่พร้อม/);
});
test("API preserves server validation errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "ห้องถูกจองแล้ว" }, { status: 409 }),
  );
  await assert.rejects(api("/bookings", {}), /ห้องถูกจองแล้ว/);
});
test("API request retains cookie and JSON body and passes AbortSignal", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/quote");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.method, "POST");
    assert.equal(options.signal, controller.signal);
    assert.deepEqual(JSON.parse(options.body), { roomId: 1 });
    return Response.json({ total: 2400 });
  });
  assert.deepEqual(
    await api("/quote", { roomId: 1 }, "POST", controller.signal),
    { total: 2400 },
  );
});
