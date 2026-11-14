// Explicit sample data. Replace this contract with an API adapter after design approval.
const recent = [
  {
    id: "RR-261114-018",
    guest: "ณัฐชา วัฒนกุล",
    room: "305",
    roomType: "Deluxe",
    checkIn: "2026-11-14",
    checkOut: "2026-11-17",
    amount: 12600,
    status: "Confirmed",
  },
  {
    id: "RR-261114-017",
    guest: "Daniel Williams",
    room: "402",
    roomType: "Suite",
    checkIn: "2026-11-14",
    checkOut: "2026-11-16",
    amount: 18400,
    status: "Pending",
  },
  {
    id: "RR-261114-016",
    guest: "พิชญา รัตนวงศ์",
    room: "208",
    roomType: "Classic",
    checkIn: "2026-11-13",
    checkOut: "2026-11-16",
    amount: 7200,
    status: "CheckedIn",
  },
  {
    id: "RR-261114-015",
    guest: "Amelia Chen",
    room: "501",
    roomType: "Penthouse",
    checkIn: "2026-11-12",
    checkOut: "2026-11-14",
    amount: 24800,
    status: "CheckedIn",
  },
  {
    id: "RR-261114-014",
    guest: "ธนกร ศิริพัฒน์",
    room: "204",
    roomType: "Classic",
    checkIn: "2026-11-14",
    checkOut: "2026-11-15",
    amount: 2400,
    status: "Cancelled",
  },
];
const series = [148000, 172000, 155500, 204000, 183000, 226000, 196000].map(
  (value, i) => ({
    date: `2026-11-${String(i + 8).padStart(2, "0")}`,
    value,
    prev: [132000, 149000, 162000, 158000, 174000, 185000, 167000][i],
  }),
);
export const dashboardMock = {
  asOf: "2026-11-14",
  rooms: {
    total: 60,
    available: 18,
    occupied: 34,
    cleaning: 6,
    maintenance: 2,
  },
  today: { checkIns: 14, checkOuts: 11, pendingIn: 6, pendingOut: 4 },
  revenue: { total: 1284500, delta: 13.97, series },
  bookings: { count: 86, cancelled: 4, byWeekday: [9, 12, 18, 11, 14, 10, 12] },
  kpi: { adr: 4200, revpar: 2380, occupancyRate: 56.7, target: 80 },
  deltas: { available: -5.3, occupied: 9.7, checkIns: 16.7, checkOuts: -8.3 },
  tasks: { cleaning: 6, repairs: 2, lowStock: 3, unpaid: 6 },
  recent,
};
export const periods = {
  "7": dashboardMock,
  "30": {
    ...dashboardMock,
    revenue: {
      total: 5261000,
      delta: 10.6,
      series: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.UTC(2026, 9, 16 + i)).toISOString().slice(0, 10),
        value:
          Math.round((140000 + (i % 7) * 9700 + (i % 3) * 16000) / 100) * 100,
        prev: 125000 + (i % 6) * 11000,
      })),
    },
    bookings: {
      count: 352,
      cancelled: 16,
      byWeekday: [38, 45, 63, 46, 57, 50, 53],
    },
    kpi: { ...dashboardMock.kpi, adr: 4160, revpar: 2357 },
  },
};
// Totals and deltas must agree with the visible chart.
Object.values(periods).forEach((data) => {
  data.revenue.total = data.revenue.series.reduce((sum, p) => sum + p.value, 0);
  const previous = data.revenue.series.reduce((sum, p) => sum + p.prev, 0);
  data.revenue.delta = (data.revenue.total / previous - 1) * 100;
});
