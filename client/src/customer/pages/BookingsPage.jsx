import React, { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import {
  Empty,
  ErrorBox,
  Heading,
  Loading,
  money,
  useResource,
} from "../shared";
export const statuses = {
  Pending: ["รอชำระมัดจำ", Clock3],
  Confirmed: ["ยืนยันแล้ว", CheckCircle2],
  CheckedIn: ["กำลังเข้าพัก", CalendarDays],
  Completed: ["เข้าพักเสร็จสิ้น", CheckCircle2],
  Cancelled: ["ยกเลิกแล้ว", XCircle],
};
export function BookingStatus({ status }) {
  const [label, Icon] = statuses[status] || [status, Clock3];
  return (
    <span className="cx-status">
      <Icon />
      {label}
    </span>
  );
}
export default function BookingsPage({ user, go }) {
  const { data, loading, error, reload } = useResource("/bookings");
  const [tab, setTab] = useState("upcoming");
  const rows = (data || [])
    .filter((b) => b.user_id === user.id)
    .filter(
      (b) =>
        tab === "all" ||
        (tab === "upcoming" &&
          !["Completed", "Cancelled"].includes(b.status)) ||
        (tab === "completed" && b.status === "Completed") ||
        (tab === "cancelled" && b.status === "Cancelled"),
    );
  return (
    <>
      <Heading
        label="YOUR MOMENTS AT RUENROM"
        title="Stays to look forward to."
      >
        การจองของคุณ ทั้งครั้งที่ผ่านมาและครั้งต่อไป
      </Heading>
      <div className="cx-tabs" role="group" aria-label="กรองการจอง">
        {[
          ["upcoming", "กำลังจะเข้าพัก"],
          ["completed", "เข้าพักแล้ว"],
          ["cancelled", "ยกเลิก"],
          ["all", "ทั้งหมด"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            className={tab === key ? "is-active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorBox message={error} retry={reload} />
      {loading ? (
        <Loading layout="rows" />
      ) : (
        rows.map((b) => (
          <article className="cx-booking-card" key={b.id}>
            <div className="cx-booking-symbol">
              <CalendarDays />
            </div>
            <div>
              <BookingStatus status={b.status} />
              <h2>{b.room_name}</h2>
              <p>
                {b.check_in} — {b.check_out} · ห้อง {b.room_number} · {b.guests}{" "}
                คน
              </p>
              <small>{b.id}</small>
            </div>
            <div>
              <strong>{money(b.total)}</strong>
              <p className="cx-caption">ชำระแล้ว {money(b.paid)}</p>
              <button
                className="cx-outline"
                onClick={() => go("/booking/" + b.id)}
              >
                ดูรายละเอียด <ArrowRight />
              </button>
            </div>
          </article>
        ))
      )}
      {!loading && !error && !rows.length && (
        <Empty icon={CalendarDays} title="ยังไม่มีการจองในหมวดนี้">
          <button className="rr-button" onClick={() => go("/rooms")}>
            ค้นหาการพักผ่อนครั้งใหม่
          </button>
        </Empty>
      )}
    </>
  );
}
