import React from "react";
import { ArrowRight, Heart } from "lucide-react";
import { money, nights } from "../lib/format";
import { favoriteKey } from "../hooks/useFavorites";
import { Amenities } from "./Amenities";
export function RoomCard({ room, filters, go, saved, toggle }) {
  const key = favoriteKey(room);
  return (
    <article className="cx-room">
      <div className="cx-room-photo">
        <img src={room.image_url} alt={room.name} loading="lazy" />
        <button
          className="cx-heart"
          onClick={() => toggle(key)}
          aria-label={`บันทึก ${room.name}`}
          aria-pressed={saved.includes(key)}
        >
          <Heart fill={saved.includes(key) ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="cx-room-body">
        <span className="rr-kicker">
          {room.type} · ROOM {room.number}
        </span>
        <h2>{room.name}</h2>
        <Amenities room={room} />
        <div className="cx-row">
          <div>
            <strong className="cx-price">{money(room.price)}</strong>
            <small> / คืน</small>
            {filters && (
              <p className="cx-caption">
                ค่าห้อง {nights(filters)} คืน {money(room.price * nights(filters))}{" "}
                · ไม่รวมแพ็กเกจ
              </p>
            )}
          </div>
          <button
            className="rr-button"
            onClick={() => go("/room/" + room.id, filters)}
          >
            ดูห้อง <ArrowRight />
          </button>
        </div>
      </div>
    </article>
  );
}
