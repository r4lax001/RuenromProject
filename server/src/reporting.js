const iso = (d) => d.toISOString().slice(0, 10);
export function addDays(d, n) {
  return iso(new Date(Date.parse(d + "T00:00:00Z") + n * 86400000));
}
const cash = (n) => Math.round(n * 100) / 100;
const percent = (now, prev) => (prev ? ((now - prev) / prev) * 100 : null);
export function dashboardData(rooms, bookings, payments, period, asOf) {
  const active = rooms.filter((r) => r.active),
    from = addDays(asOf, 1 - period),
    previousFrom = addDays(from, -period);
  const inRange = (d, a, b) => d >= a && d <= b;
  const stamp = (d) =>
    d
      ? iso(
          new Date(Date.parse(String(d).replace(" ", "T") + "Z") + 7 * 3600000),
        )
      : "";
  const daily = (d) =>
    cash(
      payments
        .filter((p) => stamp(p.paid_at) === d)
        .reduce((s, p) => s + Number(p.amount), 0),
    );
  const series = Array.from({ length: period }, (_, i) => ({
    date: addDays(from, i),
    value: daily(addDays(from, i)),
    prev: daily(addDays(previousFrom, i)),
  }));
  const total = cash(series.reduce((s, p) => s + p.value, 0)),
    prev = series.reduce((s, p) => s + p.prev, 0);
  const recentPeriod = bookings.filter((b) =>
    inRange(stamp(b.created_at), from, asOf),
  );
  const byWeekday = Array(7).fill(0);
  recentPeriod.forEach(
    (b) =>
      byWeekday[new Date(stamp(b.created_at) + "T00:00:00Z").getUTCDay()]++,
  );
  let soldNights = 0,
    roomRevenue = 0;
  for (const b of bookings.filter((b) =>
    ["CheckedIn", "Completed"].includes(b.status),
  )) {
    const nights =
      (Date.parse(b.check_out) - Date.parse(b.check_in)) / 86400000;
    const overlap = Math.max(
      0,
      (Date.parse(
        b.check_out < addDays(asOf, 1) ? b.check_out : addDays(asOf, 1),
      ) -
        Date.parse(b.check_in > from ? b.check_in : from)) /
        86400000,
    );
    soldNights += overlap;
    roomRevenue +=
      (overlap * (Number(b.room_total) - Number(b.discount))) / nights;
  }
  const todayIn = bookings.filter(
    (b) => b.check_in === asOf && b.status !== "Cancelled",
  );
  const todayOut = bookings.filter(
    (b) =>
      b.check_out === asOf && ["CheckedIn", "Completed"].includes(b.status),
  );
  const occupied = active.filter((r) => r.status === "Occupied").length;
  return {
    asOf,
    from,
    rooms: {
      total: active.length,
      available: active.filter((r) => r.status === "Vacant").length,
      occupied,
      cleaning: active.filter((r) => r.status === "Cleaning").length,
      maintenance: active.filter((r) => r.status === "Maintenance").length,
    },
    today: {
      checkIns: todayIn.length,
      checkOuts: todayOut.length,
      pendingIn: todayIn.filter((b) => b.status === "Confirmed").length,
      pendingOut: todayOut.filter((b) => b.status === "CheckedIn").length,
    },
    revenue: { total, delta: percent(total, prev), series },
    bookings: {
      count: recentPeriod.length,
      cancelled: recentPeriod.filter((b) => b.status === "Cancelled").length,
      byWeekday,
    },
    kpi: {
      adr: soldNights ? cash(roomRevenue / soldNights) : 0,
      revpar: active.length ? cash(roomRevenue / (active.length * period)) : 0,
      occupancyRate: active.length ? cash((occupied / active.length) * 100) : 0,
      target: null,
    },
    deltas: {
      available: null,
      occupied: null,
      checkIns: null,
      checkOuts: null,
    },
    recent: bookings
      .slice(0, 30)
      .map((b) => ({
        id: b.id,
        guest: b.guest_name,
        room: b.room_number,
        roomType: b.room_type,
        checkIn: b.check_in,
        checkOut: b.check_out,
        amount: Number(b.paid),
        status: b.status,
      })),
    notes:
      "รายรับตามวันรับเงินจริง; ADR/RevPAR จากคืนเข้าพักในรายการ CheckedIn/Completed ใช้จำนวนห้องที่เปิดใช้งานปัจจุบันเป็นฐาน ไม่ใช่ประวัติจำนวนห้องย้อนหลัง",
  };
}
