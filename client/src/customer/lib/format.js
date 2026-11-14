export const day = (offset = 0) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offset * 86400000));
export const money = (n) =>
  Number(n).toLocaleString("th-TH", { style: "currency", currency: "THB" });
export const nights = (f) =>
  Math.round((Date.parse(f.checkOut) - Date.parse(f.checkIn)) / 86400000);
