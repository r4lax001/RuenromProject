import React from "react";
import { BedDouble, Maximize, Users, Wifi } from "lucide-react";
export function Amenities({ room }) {
  return (
    <div className="cx-amenities">
      {[
        [BedDouble, "เตียงคู่"],
        [Users, `${room.capacity} คน`],
        [Maximize, `${room.size} ตร.ม.`],
        [Wifi, "Wi-Fi"],
      ].map(([Icon, label]) => (
        <span key={label}>
          <Icon />
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}
