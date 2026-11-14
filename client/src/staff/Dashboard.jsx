import React from "react";
import {
  BedDouble,
  LogIn,
  LogOut,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useResource, day, Loading, ErrorBox } from "../customer/shared";

const roomStates = {
  Vacant: { label: "พร้อมใช้งาน", className: "ready" },
  Occupied: { label: "มีผู้เข้าพัก", className: "occupied" },
  Cleaning: { label: "รอทำความสะอาด", className: "cleaning" },
  Maintenance: { label: "ปิดซ่อมบำรุง", className: "maintenance" },
};

export default function Dashboard({ navigate, role }) {
  const rooms = useResource("/staff/rooms");
  const bookings = useResource("/bookings");
  if (rooms.loading || bookings.loading) return <Loading />;
  if (rooms.error || bookings.error)
    return (
      <ErrorBox
        message={rooms.error || bookings.error}
        retry={() => {
          rooms.reload();
          bookings.reload();
        }}
      />
    );
  const active = rooms.data.filter((r) => r.active);
  const occupied = active.filter((r) => r.status === "Occupied").length;
  const arrivals = bookings.data.filter(
    (b) => b.check_in === day() && b.status === "Confirmed",
  );
  const departures = bookings.data.filter(
    (b) => b.check_out === day() && b.status === "CheckedIn",
  );
  const cleaning = active.filter((r) => r.status === "Cleaning").length;
  const occupancy = active.length
    ? Math.round((occupied / active.length) * 100)
    : 0;
  const roomPage = role === "Admin" ? "rooms" : "status";
  return (
    <>
      <div className="bo-dashboard-actions">
        <span>สถานะปัจจุบันจากระบบโรงแรม</span>
        <button
          onClick={() => {
            rooms.reload();
            bookings.reload();
          }}
        >
          <RefreshCw /> อัปเดตข้อมูล
        </button>
      </div>
      <div className="bo-stats">
        {[
          [
            BedDouble,
            "ห้องที่มีผู้เข้าพัก",
            occupied,
            `จาก ${active.length} ห้องที่เปิดใช้งาน`,
            roomPage,
          ],
          [LogIn, "รอเช็กอินวันนี้", arrivals.length, "รายการยืนยันแล้ว", "bookings"],
          [
            LogOut,
            "กำหนดเช็กเอาต์วันนี้",
            departures.length,
            "รายการที่กำลังเข้าพัก",
            "bookings",
          ],
          [
            Sparkles,
            "รอทำความสะอาด",
            cleaning,
            "เตรียมพร้อมสำหรับผู้เข้าพัก",
            roomPage,
          ],
        ].map(([Icon, label, value, caption, target]) => (
          <button
            className="bo-stat"
            key={label}
            onClick={() => navigate(target)}
          >
            <div>
              <Icon />
              <ArrowUpRight />
            </div>
            <span>{label}</span>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <small>{caption}</small>
          </button>
        ))}
      </div>
      <div className="bo-dashboard-grid">
        <section className="bo-panel bo-room-panel">
          <div className="bo-panel-heading">
            <div>
              <p className="bo-kicker">ROOM OVERVIEW</p>
              <h2>ทุกห้อง ทุกสถานะ</h2>
            </div>
            <button onClick={() => navigate(roomPage)}>
              จัดการห้อง <ArrowUpRight />
            </button>
          </div>
          <div className="bo-legend">
            {Object.entries(roomStates).map(([key, s]) => (
              <span key={key}>
                <i className={`bo-dot ${s.className}`} />
                {s.label}
              </span>
            ))}
          </div>
          <div className="bo-room-grid">
            {active.map((room) => {
              const state = roomStates[room.status] || {
                label: room.status,
                className: "",
              };
              return (
                <button
                  key={room.id}
                  className={`bo-room ${state.className}`}
                  onClick={() => navigate(roomPage)}
                  aria-label={`ห้อง ${room.number} ${state.label}`}
                >
                  <BedDouble />
                  <strong>{room.number}</strong>
                  <span>{room.type}</span>
                  <small>{state.label}</small>
                </button>
              );
            })}
          </div>
          {!active.length && <p className="bo-empty">ยังไม่มีห้องที่เปิดใช้งาน</p>}
          <p className="bo-room-note">
            สถานะการปฏิบัติงานปัจจุบัน ไม่ใช่จำนวนห้องว่างสำหรับจองล่วงหน้า
          </p>
        </section>
        <aside className="bo-occupancy">
          <p className="bo-kicker">LIVE OCCUPANCY</p>
          <h2>การเข้าพักขณะนี้</h2>
          <div className="bo-ring" style={{ "--occupancy": `${occupancy}%` }}>
            <div>
              <strong>
                {occupancy}
                <small>%</small>
              </strong>
              <span>ของห้องที่เปิดใช้งาน</span>
            </div>
          </div>
          <div className="bo-occupancy-row">
            <span>มีผู้เข้าพัก</span>
            <strong>{occupied} ห้อง</strong>
          </div>
          <div className="bo-occupancy-row">
            <span>เปิดใช้งานทั้งหมด</span>
            <strong>{active.length} ห้อง</strong>
          </div>
          <button onClick={() => navigate("bookings")}>
            ดูรายการเข้าพัก <ArrowUpRight />
          </button>
        </aside>
      </div>
      <section className="bo-panel">
        <div className="bo-panel-heading">
          <div>
            <p className="bo-kicker">TODAY'S MOVEMENTS</p>
            <h2>เตรียมต้อนรับ ดูแลก่อนเดินทาง</h2>
          </div>
          <button onClick={() => navigate("bookings")}>
            การจองทั้งหมด <ArrowUpRight />
          </button>
        </div>
        <div className="bo-movements">
          {[
            ["รอเช็กอิน", arrivals, LogIn],
            ["กำหนดเช็กเอาต์", departures, LogOut],
          ].map(([label, rows, Icon]) => (
            <div key={label}>
              <h3>
                <Icon />
                {label}
                <span>{rows.length}</span>
              </h3>
              {rows.length ? (
                rows.slice(0, 5).map((b) => (
                  <button
                    className="bo-arrival"
                    key={b.id}
                    onClick={() => navigate("bookings")}
                  >
                    <span className="bo-room-number">{b.room_number}</span>
                    <span>
                      <strong>{b.guest_name}</strong>
                      <small>{b.id}</small>
                    </span>
                    <ArrowUpRight />
                  </button>
                ))
              ) : (
                <div className="bo-empty">
                  <CalendarDays />
                  <p>ไม่มีรายการ{label}วันนี้</p>
                </div>
              )}
              {rows.length > 5 && (
                <button onClick={() => navigate("bookings")}>
                  ดูทั้งหมด {rows.length} รายการ
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
