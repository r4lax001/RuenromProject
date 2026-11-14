import LoadingImage from "../LoadingImage";
import {
  ArrowUpRight,
  BedDouble,
  Heart,
  MapPin,
  Users,
  Wifi,
  Maximize,
} from "lucide-react";

import { useFavorites } from "../../customer/hooks/useFavorites";

const baht = (n) => new Intl.NumberFormat("th-TH").format(n);

export default function RoomCard({ room, onSelect }) {
  const [saved, toggleFavorite] = useFavorites();
  const favorite = saved.includes(room.id);
  const toggle = () => toggleFavorite(room.id);
  return (
    <article className="rr-room">
      <div className="rr-room-image">
        <LoadingImage src={room.image} alt={`ห้องพัก ${room.name}`} loading="lazy" />
        <button
          className={`rr-favorite ${favorite ? "is-selected" : ""}`}
          aria-label={`บันทึก ${room.name}`}
          aria-pressed={favorite}
          onClick={toggle}
        >
          <Heart />
        </button>
        <span className="rr-room-type">{room.type}</span>
      </div>
      <div className="rr-room-content">
        <div className="rr-room-location">
          <MapPin /> RUENROM · BANGKOK
        </div>
        <h3>{room.name}</h3>
        <p>{room.caption}</p>
        <div className="rr-amenities">
          <span title="เตียงคู่">
            <BedDouble />
            <span>เตียงคู่</span>
          </span>
          <span title="จำนวนผู้เข้าพัก">
            <Users />
            <span>{room.guests} คน</span>
          </span>
          <span title="พื้นที่ห้อง">
            <Maximize />
            <span>{room.size} ตร.ม.</span>
          </span>
          <span title="Wi-Fi">
            <Wifi />
            <span>Wi-Fi</span>
          </span>
        </div>
        <div className="rr-room-bottom">
          <span>
            <small>เริ่มต้น / คืน</small>
            <strong>฿{baht(room.price)}</strong>
          </span>
          <button
            className="rr-icon rr-select-room"
            onClick={onSelect}
            aria-label={`ค้นหาห้องว่าง ${room.name}`}
          >
            <ArrowUpRight />
          </button>
        </div>
      </div>
    </article>
  );
}
