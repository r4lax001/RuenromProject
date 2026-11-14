import React, { useState, useId } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Eye,
  BedDouble,
  CalendarDays,
} from "lucide-react";
export const money = (value) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"));
export function Delta({ value }) {
  if (value == null) return <span className="sd-muted">—</span>;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`sd-delta ${value >= 0 ? "positive" : "negative"}`}>
      <Icon />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
export function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  caption,
  onClick,
}) {
  return (
    <button className="sd-card sd-kpi" onClick={onClick}>
      <span className="sd-kpi-label">
        {label}
        <Icon />
      </span>
      <span className="sd-kpi-number">
        {value}
        <small>{suffix}</small>
      </span>
      <span className="sd-kpi-bottom">
        <Delta value={delta} />
        <span>{delta == null ? "สถานะปัจจุบัน" : "เทียบช่วงก่อนหน้า"}</span>
      </span>
      {caption && <span className="sd-kpi-caption">{caption}</span>}
    </button>
  );
}
export function RevenueChart({ data, onDetail }) {
  const id = useId().replaceAll(":", "");
  const [point, setPoint] = useState(null);
  const { series } = data.revenue;
  const max =
    Math.ceil(
      Math.max(1, ...series.map((p) => Math.max(p.value, p.prev))) / 50000,
    ) * 50000;
  const x = (i) => 38 + (i * 600) / (series.length - 1),
    y = (v) => 172 - (v / max) * 144;
  const path = (key) =>
    series.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
  const selected = point === null ? null : series[point];
  return (
    <section className="sd-card sd-revenue">
      <div className="sd-card-title">
        <h2>รายรับ</h2>
        <span className="sd-chart-legend">
          <i />
          ช่วงที่เลือก <i className="previous" />
          ช่วงก่อนหน้า
        </span>
      </div>
      <div className="sd-revenue-total">
        <strong>{money(data.revenue.total)}</strong>
        <Delta value={data.revenue.delta} />
      </div>
      <div className="sd-chart" onMouseLeave={() => setPoint(null)}>
        <svg
          viewBox="0 0 660 210"
          role="img"
          aria-label="กราฟรายรับ เปรียบเทียบช่วงก่อนหน้า"
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sd-navy)" stopOpacity=".15" />
              <stop offset="100%" stopColor="var(--sd-navy)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <line
                x1="38"
                x2="638"
                y1={y((max * i) / 3)}
                y2={y((max * i) / 3)}
                className="sd-gridline"
              />
              <text x="0" y={y((max * i) / 3) + 4} className="sd-axis">
                {Math.round((max * i) / 3000)}k
              </text>
            </g>
          ))}
          <path
            d={`${path("value")} L638,172 L38,172 Z`}
            fill={`url(#${id})`}
          />
          <path d={path("prev")} className="sd-line previous" />
          <path d={path("value")} className="sd-line" />
          {series.map((p, i) => (
            <circle
              key={p.date}
              cx={x(i)}
              cy={y(p.value)}
              r={point === i ? 5 : 4}
              className="sd-chart-point"
              tabIndex="0"
              aria-label={`${dateLabel(p.date)} รายรับ ${money(p.value)} ช่วงก่อน ${money(p.prev)}`}
              onFocus={() => setPoint(i)}
              onBlur={() => setPoint(null)}
              onMouseEnter={() => setPoint(i)}
            >
              <title>
                {dateLabel(p.date)}: {money(p.value)}
              </title>
            </circle>
          ))}
          {[0, Math.floor((series.length - 1) / 2), series.length - 1].map(
            (i) => (
              <text
                key={i}
                x={x(i)}
                y="201"
                textAnchor={
                  i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"
                }
                className="sd-axis"
              >
                {dateLabel(series[i].date).replace(" 2026", "")}
              </text>
            ),
          )}
        </svg>
        <div className="sd-chart-readout" aria-live="polite">
          {selected
            ? `${dateLabel(selected.date)} · ${money(selected.value)} / ก่อนหน้า ${money(selected.prev)}`
            : "ชี้หรือโฟกัสจุดบนกราฟเพื่อดูรายรับแต่ละวัน"}
        </div>
      </div>
      <div className="sd-substats">
        {[
          ["ยอดจอง", `${data.bookings.count} รายการ`, "navy"],
          ["ยกเลิก", `${data.bookings.cancelled} รายการ`, "gold"],
          [
            "ADR / RevPAR",
            `${money(data.kpi.adr)} / ${money(data.kpi.revpar)}`,
            "muted",
          ],
        ].map(([label, value, color]) => (
          <button key={label} className={color} onClick={() => onDetail(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
export function WeekdayBars({ values }) {
  const max = Math.max(1, ...values);
  return (
    <section className="sd-card sd-weekdays">
      <h2>วันที่มีการจองสูงสุด</h2>
      <div className="sd-bars">
        {values.map((value, i) => (
          <div key={i}>
            <span>{value === max ? value : ""}</span>
            <button
              title={`${["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"][i]} ${value} รายการ`}
              aria-label={`${["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"][i]} ${value} การจอง`}
              className={value === max ? "highest" : ""}
              style={{ height: `${(value / max) * 76}px` }}
            >
              <span className="sd-bar-tip">{value}</span>
            </button>
            <small>{["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][i]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function OccupancyGauge({ kpi, onClick }) {
  return (
    <section className="sd-card sd-gauge">
      <h2>อัตราการเข้าพัก</h2>
      <div className="sd-gauge-body">
        <svg
          viewBox="0 0 240 132"
          role="img"
          aria-label={`อัตราการเข้าพัก ${kpi.occupancyRate}%`}
        >
          {Array.from({ length: 40 }, (_, i) => {
            const a = Math.PI + (i * Math.PI) / 39;
            return (
              <line
                key={i}
                x1={120 + 92 * Math.cos(a)}
                y1={116 + 92 * Math.sin(a)}
                x2={120 + 108 * Math.cos(a)}
                y2={116 + 108 * Math.sin(a)}
                stroke={
                  i / 40 < kpi.occupancyRate / 100
                    ? "var(--sd-navy)"
                    : "var(--sd-border)"
                }
                strokeWidth="4"
              />
            );
          })}
        </svg>
        <div>
          <strong>
            {kpi.occupancyRate.toFixed(1)}
            <small>%</small>
          </strong>
          <span>จากห้องที่เปิดใช้งานปัจจุบัน</span>
        </div>
      </div>
      <button className="sd-text-button" onClick={onClick}>
        ดูรายละเอียด <ChevronRight />
      </button>
    </section>
  );
}
export function RoomStatusStrip({ rooms, onSelect }) {
  return (
    <section className="sd-card sd-room-strip" aria-label="สถานะห้องพัก">
      {[
        ["ว่าง", rooms.available, "success"],
        ["มีผู้พัก", rooms.occupied, "navy"],
        ["รอทำความสะอาด", rooms.cleaning, "warning"],
        ["ซ่อมบำรุง", rooms.maintenance, "danger"],
      ].map(([label, value, color]) => (
        <button key={label} onClick={() => onSelect(label)}>
          <span>
            <i className={`sd-dot ${color}`} />
            {label}
            <strong>
              {value}
              <small> / {rooms.total}</small>
            </strong>
          </span>
          <span className="sd-track">
            <i
              className={color}
              style={{ width: `${(value / (rooms.total || 1)) * 100}%` }}
            />
          </span>
        </button>
      ))}
    </section>
  );
}
export const statuses = {
  Pending: "รอชำระ",
  Confirmed: "ยืนยันแล้ว",
  CheckedIn: "เข้าพักแล้ว",
  Cancelled: "ยกเลิก",
  Completed: "เช็กเอาต์แล้ว",
};
export function BookingsTable({ rows, asOf, query, onView, tab, setTab }) {
  const visible = rows.filter(
    (r) =>
      `${r.id} ${r.guest} ${r.room}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (tab === "all" ||
        (tab === "in" && r.checkIn === asOf && r.status !== "Cancelled") ||
        (tab === "stay" && r.status === "CheckedIn") ||
        (tab === "out" && r.checkOut === asOf && r.status === "CheckedIn")),
  );
  return (
    <section className="sd-card sd-bookings" id="sd-bookings">
      <div className="sd-card-title">
        <h2>การจองล่าสุด</h2>
        <button className="sd-text-button" onClick={() => setTab("all")}>
          ดูทั้งหมด <ArrowUpRight />
        </button>
      </div>
      <div className="sd-tabs" aria-label="กรองการจอง">
        {[
          ["all", "ทั้งหมด"],
          ["in", "เข้าในวันนี้"],
          ["stay", "กำลังพัก"],
          ["out", "ออกในวันนี้"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            {[
              "เลขจอง",
              "ผู้เข้าพัก",
              "ห้อง / ประเภท",
              "วันที่เข้า–ออก",
              "ยอดชำระ",
              "สถานะ",
              "",
            ].map((label, i) => (
              <th key={i}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id}>
              <td data-label="เลขจอง">{r.id}</td>
              <td data-label="ผู้เข้าพัก">
                <span className="sd-guest">
                  <span className="sd-avatar">{r.guest.slice(0, 1)}</span>
                  {r.guest}
                </span>
              </td>
              <td data-label="ห้อง">
                <span className="sd-room-cell">
                  <BedDouble />
                  {r.room}
                  <small>{r.roomType}</small>
                </span>
              </td>
              <td data-label="วันที่เข้า–ออก">
                {dateLabel(r.checkIn).replace(" 2026", "")}
                <small>{dateLabel(r.checkOut)}</small>
              </td>
              <td data-label="ยอดชำระ">{money(r.amount)}</td>
              <td data-label="สถานะ">
                <span className={`sd-status ${r.status}`}>
                  <i />
                  {statuses[r.status]}
                </span>
              </td>
              <td>
                <button
                  className="sd-icon"
                  title={`ดูการจอง ${r.id}`}
                  aria-label={`ดูการจอง ${r.id}`}
                  onClick={() => onView(r)}
                >
                  <Eye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && (
        <div className="sd-empty">
          <CalendarDays />
          <p>ไม่พบการจองที่ตรงกับเงื่อนไข</p>
        </div>
      )}
    </section>
  );
}
export function DashboardSkeleton() {
  return (
    <div className="sd-skeleton" role="status" aria-label="กำลังโหลด Dashboard">
      <div>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} />
        ))}
      </div>
      <span />
      <span />
    </div>
  );
}
