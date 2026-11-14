import React, { useState } from "react";
import "./rooms.css";
import { ArrowUpDown, Heart, SlidersHorizontal } from "lucide-react";
import {
  Empty,
  ErrorBox,
  Heading,
  Loading,
  RoomCard,
  SearchForm,
  useFavorites,
  useResource,
} from "../shared";

export default function RoomsPage({ filters, go, favorites = false }) {
  const params = new URLSearchParams({
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: filters.guests,
  });
  const { data, loading, error, reload } = useResource(
    "/rooms" + (favorites ? "" : "?" + params),
  );
  const [saved, toggle] = useFavorites();
  const [sort, setSort] = useState("price");
  const [max, setMax] = useState("");
  const [open, setOpen] = useState(false);
  const rows = (data || [])
    .filter(
      (r) =>
        (!filters.type || r.type === filters.type) &&
        (!max || Number(r.price) <= Number(max)) &&
        (!favorites || saved.includes(r.type.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : b.size - a.size,
    );
  const unique = favorites
    ? rows.filter((r, i) => rows.findIndex((x) => x.type === r.type) === i)
    : rows;
  return (
    <>
      <Heading
        label={favorites ? "SAVED FOR LATER" : "FIND YOUR QUIET"}
        title={favorites ? "Your little wishlist." : "Make room for yourself."}
      >
        {favorites
          ? "ห้องที่คุณบันทึกไว้บนอุปกรณ์นี้"
          : "เลือกห้องที่ใช่ แล้วปล่อยให้เวลาที่เหลือเป็นของคุณ"}
      </Heading>
      {!favorites && (
        <SearchForm filters={filters} onSearch={(f) => go("/rooms", f)} />
      )}
      <div className="cx-toolbar">
        <span>
          {unique.length} {favorites ? "ประเภทห้องที่บันทึก" : "ห้องที่พร้อมต้อนรับ"}
        </span>
        <div>
          <button
            className="cx-outline"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <SlidersHorizontal />
            ตัวกรอง
          </button>
          <label className="cx-sort">
            <ArrowUpDown />
            <select
              aria-label="เรียงห้องพัก"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="price">ราคาน้อยไปมาก</option>
              <option value="price-desc">ราคามากไปน้อย</option>
              <option value="size">พื้นที่มากที่สุด</option>
            </select>
          </label>
        </div>
      </div>
      {open && (
        <div className="cx-panel cx-filters">
          <label>
            ประเภทห้อง
            <select
              value={filters.type}
              onChange={(e) =>
                go(favorites ? "/favorites" : "/rooms", {
                  ...filters,
                  type: e.target.value,
                })
              }
            >
              <option value="">ทุกประเภท</option>
              {["Classic", "Deluxe", "Suite", "Penthouse"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            ราคาสูงสุดต่อคืน
            <input
              type="number"
              min="0"
              placeholder="ไม่จำกัด"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </label>
          <button
            className="cx-text"
            onClick={() => {
              setMax("");
              go(favorites ? "/favorites" : "/rooms", { ...filters, type: "" });
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}
      <ErrorBox message={error} retry={reload} />
      {loading ? (
        <Loading />
      ) : (
        !error && (
          <div
            className={`cx-results${favorites ? "" : " cx-results--compact"}`}
          >
            {unique.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                filters={favorites ? null : filters}
                go={go}
                saved={saved}
                toggle={toggle}
              />
            ))}
          </div>
        )
      )}
      {!loading && !error && !unique.length && (
        <Empty
          icon={favorites ? Heart : undefined}
          title={favorites ? "ยังไม่มีห้องในรายการโปรด" : "ไม่พบห้องตามเงื่อนไขนี้"}
        >
          <button className="rr-button" onClick={() => go("/rooms")}>
            ค้นหาห้องพัก
          </button>
        </Empty>
      )}
    </>
  );
}
