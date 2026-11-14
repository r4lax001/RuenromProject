import { day } from "./format.js";

export function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}
export function nextDate(value) {
  return new Date(Date.parse(value) + 86400000).toISOString().slice(0, 10);
}
export function stayError({ checkIn, checkOut, guests }, currentDay = day()) {
  if (!isDate(checkIn) || !isDate(checkOut))
    return "กรุณาเลือกวันเช็กอินและเช็กเอาต์ให้ครบ";
  const count = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  if (checkIn < currentDay || count < 1 || count > 365)
    return "เลือกวันตั้งแต่วันนี้ และเข้าพักระหว่าง 1–365 คืน";
  if (
    !Number.isInteger(Number(guests)) ||
    Number(guests) < 1 ||
    Number(guests) > 4
  )
    return "เลือกจำนวนผู้เข้าพัก 1–4 คน";
  return "";
}
// URLs are editable input: never let invalid dates produce NaN prices or crashes.
export function filtersFromQuery(query, currentDay = day()) {
  const rawIn = query.get("checkIn");
  const checkIn = isDate(rawIn) && rawIn >= currentDay ? rawIn : currentDay;
  const rawOut = query.get("checkOut");
  const length = (Date.parse(rawOut) - Date.parse(checkIn)) / 86400000;
  const checkOut =
    isDate(rawOut) && length >= 1 && length <= 365 ? rawOut : nextDate(checkIn);
  const rawGuests = Number(query.get("guests"));
  const guests =
    Number.isInteger(rawGuests) && rawGuests >= 1 && rawGuests <= 4
      ? rawGuests
      : 2;
  const type = ["Classic", "Deluxe", "Suite", "Penthouse"].includes(
    query.get("type"),
  )
    ? query.get("type")
    : "";
  return { checkIn, checkOut, guests, type };
}
