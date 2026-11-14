import {
  BedDouble,
  DoorOpen,
  BrushCleaning,
  Wrench,
  CircleOff,
} from "lucide-react";
export const roomStatuses = {
  all: { label: "ห้องทั้งหมด", icon: BedDouble },
  Vacant: { label: "พร้อมเข้าพัก", icon: DoorOpen },
  Occupied: { label: "มีผู้เข้าพัก", icon: BedDouble },
  Cleaning: { label: "ทำความสะอาด", icon: BrushCleaning },
  Maintenance: { label: "ซ่อมบำรุง", icon: Wrench },
  inactive: { label: "ปิดใช้งาน", icon: CircleOff },
};
export const emptyRoom = {
  number: "",
  name: "",
  type: "Classic",
  price: 2400,
  capacity: 2,
  size: 32,
  image_url: "",
  active: true,
  is_lucky: false,
};
export function roomPayload(room) {
  return Object.fromEntries(
    Object.keys(emptyRoom).map((key) => [
      key,
      typeof emptyRoom[key] === "boolean" ? !!room[key] : room[key],
    ]),
  );
}
