import React, { useState } from "react";
import { useResource, Loading, ErrorBox, day, money } from "../customer/shared";
import { Dialog } from "../components/home/Dialog";
import { BookingDetails } from "./Bookings";
export default function Payments({ run }) {
  const [detail, setDetail] = useState(null);
  const [range, setRange] = useState({ from: day(-30), to: day() });
  const [query, setQuery] = useState(new URLSearchParams(range).toString());
  const resource = useResource("/payments?" + query);
  const rows = resource.data || [];
  function load() {
    const next = new URLSearchParams(range).toString();
    if (query === next) resource.reload();
    else setQuery(next);
  }
  const total = rows.reduce((n, p) => n + Number(p.amount), 0),
    room = rows.reduce(
      (n, p) =>
        n +
        (p.total
          ? Math.round(
              ((p.amount * (p.room_total - p.discount)) / p.total) * 100,
            ) / 100
          : 0),
      0,
    );
  return (
    <>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        {["from", "to"].map((k) => (
          <label key={k}>
            {k === "from" ? "จากวันที่" : "ถึงวันที่"}
            <input
              type="date"
              required
              value={range[k]}
              onChange={(e) => setRange({ ...range, [k]: e.target.value })}
            />
          </label>
        ))}
        <button className="gold">ดูรายงาน</button>
        <a
          className="button"
          href={
            "/api/payments?" + new URLSearchParams({ ...range, format: "csv" })
          }
        >
          ส่งออก CSV
        </a>
      </form>
      {resource.loading ? <Loading layout="rows" /> : resource.error ? <ErrorBox message={resource.error} retry={resource.reload} /> : <>
      <div className="promos">
        {[
          ["รับชำระรวม", total],
          ["รับชำระส่วนค่าห้อง (ปันส่วน)", room],
          ["แพ็กเกจ / บริการ (ปันส่วน)", total - room],
        ].map(([s, n]) => (
          <article key={s}>
            <p>{s}</p>
            <h2>{money(n)}</h2>
          </article>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>การจอง</th>
              <th>ผู้เข้าพัก</th>
              <th>ประเภท</th>
              <th>ยอดเงิน</th>
              <th>วันรับชำระ (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <button onClick={() => setDetail(p.booking_id)}>
                    {p.booking_id}
                  </button>
                </td>
                <td>{p.guest_name}</td>
                <td>{p.kind}</td>
                <td>{money(p.amount)}</td>
                <td>{p.paid_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
      {detail && (
        <Dialog title="เอกสารการรับชำระ" onClose={() => setDetail(null)}>
          <BookingDetails id={detail} />
        </Dialog>
      )}
    </>
  );
}
