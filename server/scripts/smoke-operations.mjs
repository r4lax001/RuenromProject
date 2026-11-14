import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/db.js";
import { today } from "../src/pricing.js";
import { addDays } from "../src/reporting.js";
const origin = "http://localhost:3000";
let cookie = "",
  roomId,
  bookingId,
  itemId;
async function request(
  path,
  body,
  method = body ? "POST" : "GET",
  expected = 200,
) {
  const response = await fetch(origin + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
  return data;
}
try {
  const response = await fetch(origin + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@ruenrom.test",
      password: process.env.DEMO_PASSWORD,
    }),
  });
  assert.equal(response.status, 200);
  cookie = response.headers.get("set-cookie").split(";")[0];
  for (const path of [
    "dashboard",
    "customers",
    "settings",
    "room-types",
    "employees",
    "shifts",
    "tasks",
    "inventory",
    "bookings",
  ])
    await request("/staff/" + path);
  const room = await request(
    "/admin/rooms",
    {
      number: "Q" + Date.now().toString().slice(-8),
      name: "QA temporary room",
      type: "Classic",
      price: 100,
      capacity: 2,
      size: 20,
      image_url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
      active: true,
      is_lucky: false,
    },
    "POST",
    201,
  );
  roomId = room.id;
  const booking = await request(
    "/staff/bookings",
    {
      roomId,
      checkIn: today(),
      checkOut: addDays(today(), 1),
      guests: 1,
      guestName: "QA temporary guest",
      email: "qa-operations@example.test",
      phone: "0800000000",
      requests: "Temporary integration test",
      packageIds: [],
    },
    "POST",
    201,
  );
  bookingId = booking.id;
  const payment = {
    amount: 20,
    method: "Cash",
    reference: "QA test only",
    requestId: randomUUID(),
  };
  await request(`/staff/bookings/${bookingId}/receive`, payment);
  await request(`/staff/bookings/${bookingId}/receive`, payment);
  let detail = await request("/staff/bookings/" + bookingId);
  assert.equal(detail.payments.length, 1);
  assert.equal(Number(detail.paid), 20);
  await request(`/bookings/${bookingId}/checkin`, {}, "POST", 400);
  await request(`/bookings/${bookingId}/checkin`, { verified: true });
  await request(
    `/bookings/${bookingId}/checkout`,
    { settleBalance: true },
    "POST",
    400,
  );
  await request(`/staff/bookings/${bookingId}/charges`, {
    label: "QA service",
    amount: 10,
  });
  await request(`/staff/bookings/${bookingId}/receive`, {
    ...payment,
    amount: 90,
    requestId: randomUUID(),
  });
  await request(`/bookings/${bookingId}/checkout`, { settleBalance: true });
  const task = (await request("/staff/tasks")).find(
    (t) => t.room_id === roomId,
  );
  assert.ok(task);
  await request(
    `/staff/rooms/${roomId}/status`,
    { status: "Vacant" },
    "PATCH",
    400,
  );
  await request(
    "/staff/tasks/" + task.id,
    { status: "Done", assigneeId: null, notes: "QA completed" },
    "PUT",
  );
  assert.equal(
    (await request("/staff/rooms")).find((r) => r.id === roomId).status,
    "Vacant",
  );
  const name = "QA " + randomUUID();
  await request("/staff/inventory", { name, unit: "piece", minimum: 2 });
  itemId = (await request("/staff/inventory")).find((i) => i.name === name).id;
  await request(`/staff/inventory/${itemId}/move`, {
    delta: 5,
    note: "QA receive",
  });
  await request(
    `/staff/inventory/${itemId}/move`,
    { delta: -6, note: "QA reject" },
    "POST",
    400,
  );
  assert.equal(
    Number(
      (await request("/staff/inventory")).find((i) => i.id === itemId).quantity,
    ),
    5,
  );
  const saved = cookie;
  cookie = "";
  await request("/staff/dashboard", undefined, "GET", 401);
  cookie = saved;
  console.log(
    "PASS: all staff reads, booking, idempotent receipt, verified check-in, balance guard, checkout, housekeeping, stock guard and anonymous access",
  );
} finally {
  // Remove only records created by this run, in FK order. Never touch existing hotel data.
  if (bookingId) {
    await db.execute("DELETE FROM receipt_requests WHERE booking_id=?", [
      bookingId,
    ]);
    await db.execute("DELETE FROM payments WHERE booking_id=?", [bookingId]);
    await db.execute("DELETE FROM booking_charges WHERE booking_id=?", [
      bookingId,
    ]);
    await db.execute("DELETE FROM stay_events WHERE booking_id=?", [bookingId]);
    await db.execute("DELETE FROM bookings WHERE id=?", [bookingId]);
  }
  if (roomId) {
    await db.execute("DELETE FROM hotel_tasks WHERE room_id=?", [roomId]);
    await db.execute("DELETE FROM rooms WHERE id=?", [roomId]);
  }
  if (itemId) {
    await db.execute("DELETE FROM stock_movements WHERE item_id=?", [itemId]);
    await db.execute("DELETE FROM inventory WHERE id=?", [itemId]);
  }
  await db.end();
}
