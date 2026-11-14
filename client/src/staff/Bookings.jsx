import React, { useState } from "react";
import { Loading, api, useResource, money, day } from "../customer/shared";
import { Dialog } from "../components/home/Dialog";
import { statuses } from "./dashboard/Widgets";
export default function Bookings({ user }) {
  const resource = useResource("/staff/bookings"),
    rooms = useResource("/staff/rooms");
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [modal, setModal] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const front = user.role !== "Accounting";
  function open(mode, b = {}) {
    setError("");
    setModal({ mode, b, requestId: crypto.randomUUID() });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const { mode, b } = modal;
      let path = `/staff/bookings/${b.id}`,
        method = "POST",
        body = f;
      if (mode === "create") {
        path = "/staff/bookings";
        body = {
          ...f,
          roomId: Number(f.roomId),
          guests: Number(f.guests),
          packageIds: [],
        };
      }
      if (mode === "reschedule") {
        path += "/reschedule";
        body = {
          roomId: Number(f.roomId),
          guests: Number(f.guests),
          checkIn: f.checkIn,
          checkOut: f.checkOut,
          packageIds: [],
        };
      }
      if (mode === "edit") method = "PUT";
      if (mode === "receive") {
        path += "/receive";
        body = { ...f, amount: Number(f.amount), requestId: modal.requestId };
      }
      if (mode === "charges") {
        path += "/charges";
        body = { ...f, amount: Number(f.amount) };
      }
      if (["cancel", "checkin", "checkout"].includes(mode)) {
        path = `/bookings/${b.id}/${mode}`;
        body = { verified: f.verified === "on", settleBalance: true };
      }
      await api(path, body, method);
      setModal(null);
      resource.reload();
      rooms.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const rows = (resource.data || []).filter(
    (b) =>
      (!status || b.status === status) &&
      `${b.id} ${b.guest_name} ${b.room_number}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="bo-table-toolbar">
        <label>
          ค้นหาการจอง
          <input
            type="search"
            placeholder="ชื่อผู้เข้าพัก เลขจอง หรือเลขห้อง"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          สถานะ
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button onClick={resource.reload}>อัปเดตข้อมูล</button>
        {front && (
          <button className="sd-primary" onClick={() => open("create")}>
            + สร้างการจอง
          </button>
        )}
      </div>
      {resource.error && <p role="alert">{resource.error}</p>}
      {resource.loading ? (
        <Loading layout="rows" label="กำลังโหลดการจอง" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "เลขการจอง / ผู้เข้าพัก",
                  "ห้อง",
                  "วันที่",
                  "สถานะ",
                  "รวม / ชำระแล้ว",
                  "ดำเนินการ",
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.id}
                    <small>{b.guest_name}</small>
                  </td>
                  <td>
                    {b.room_name}
                    <small>ห้อง {b.room_number}</small>
                  </td>
                  <td>
                    {b.check_in}
                    <small>ถึง {b.check_out}</small>
                  </td>
                  <td>
                    <span className="badge">{statuses[b.status]}</span>
                  </td>
                  <td>
                    {money(b.total)}
                    <small>ชำระแล้ว {money(b.paid)}</small>
                  </td>
                  <td>
                    <button onClick={() => open("detail", b)}>
                      รายละเอียด / เอกสาร
                    </button>
                    {["Pending", "Confirmed", "CheckedIn"].includes(b.status) &&
                      Number(b.paid) < Number(b.total) && (
                        <button
                          className="cx-confirm"
                          onClick={() => open("receive", b)}
                        >
                          รับชำระ
                        </button>
                      )}
                    {front && (
                      <>
                        {["Pending", "Confirmed"].includes(b.status) && (
                          <>
                            {b.status === "Pending" && Number(b.paid) === 0 && (
                              <button onClick={() => open("reschedule", b)}>
                                เปลี่ยนวัน / ห้อง
                              </button>
                            )}
                            <button onClick={() => open("edit", b)}>
                              แก้ไข
                            </button>
                            <button
                              className="cx-cancel"
                              onClick={() => open("cancel", b)}
                            >
                              ยกเลิก
                            </button>
                          </>
                        )}
                        {b.status === "Confirmed" && (
                          <button
                            className="cx-confirm"
                            onClick={() => open("checkin", b)}
                          >
                            เช็กอิน
                          </button>
                        )}
                        {["Confirmed", "CheckedIn"].includes(b.status) && (
                          <button onClick={() => open("charges", b)}>
                            ค่าบริการเพิ่ม
                          </button>
                        )}
                        {b.status === "CheckedIn" && (
                          <button
                            className="cx-confirm"
                            onClick={() => open("checkout", b)}
                          >
                            เช็กเอาต์
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="bo-empty">ไม่พบรายการจอง</p>}
        </div>
      )}
      {modal && (
        <Dialog
          title={
            {
              create: "สร้างการจอง",
              reschedule: "เปลี่ยนวันหรือห้องพัก",
              edit: "แก้ไขข้อมูลผู้เข้าพัก",
              receive: "บันทึกรับชำระ",
              charges: "เพิ่มค่าบริการ",
              cancel: "ยืนยันยกเลิกการจอง",
              checkin: "ตรวจสอบก่อนเช็กอิน",
              checkout: "ตรวจสอบก่อนเช็กเอาต์",
              detail: "รายละเอียดการจอง",
            }[modal.mode]
          }
          onClose={() => setModal(null)}
          dismissible={!busy}
        >
          {modal.mode === "detail" ? (
            <BookingDetails id={modal.b.id} />
          ) : (
            <form className="rm-form" onSubmit={submit}>
              {error && (
                <p role="alert" className="rm-error">
                  {error}
                </p>
              )}
              {modal.b.id && (
                <p>
                  {modal.b.id} · {modal.b.guest_name} · ห้อง{" "}
                  {modal.b.room_number}
                </p>
              )}
              {["create", "edit"].includes(modal.mode) && (
                <>
                  <label>
                    ชื่อผู้เข้าพัก
                    <input
                      name="guestName"
                      defaultValue={modal.b.guest_name}
                      required
                      maxLength={120}
                    />
                  </label>
                  <label>
                    อีเมล
                    <input
                      name="email"
                      type="email"
                      defaultValue={modal.b.email}
                      required
                    />
                  </label>
                  <label>
                    โทรศัพท์
                    <input
                      name="phone"
                      defaultValue={modal.b.phone}
                      required
                      pattern="[+0-9 ()\-]{8,30}"
                    />
                  </label>
                  <label>
                    คำขอเพิ่มเติม
                    <textarea
                      name="requests"
                      defaultValue={modal.b.requests}
                      maxLength={2000}
                    />
                  </label>
                </>
              )}
              {["create", "reschedule"].includes(modal.mode) && (
                <>
                  <label>
                    ห้องพัก
                    <select
                      name="roomId"
                      defaultValue={modal.b.room_id || ""}
                      required
                    >
                      <option value="">
                        เลือกห้อง (ระบบตรวจวันว่างอีกครั้งเมื่อบันทึก)
                      </option>
                      {(rooms.data || [])
                        .filter(
                          (r) =>
                            r.active &&
                            !["Cleaning", "Maintenance"].includes(r.status),
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.number} · {r.name} · {money(r.price)}/คืน
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="rm-form-grid">
                    <label>
                      เช็กอิน
                      <input
                        defaultValue={modal.b.check_in}
                        name="checkIn"
                        type="date"
                        min={day()}
                        required
                      />
                    </label>
                    <label>
                      เช็กเอาต์
                      <input
                        defaultValue={modal.b.check_out}
                        name="checkOut"
                        type="date"
                        min={day(1)}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    จำนวนผู้เข้าพัก
                    <input
                      name="guests"
                      type="number"
                      defaultValue={modal.b.guests || 2}
                      min={1}
                      max={10}
                      required
                    />
                  </label>
                  <p>
                    ระบบจะคำนวณราคาใหม่โดยไม่ใช้โปรโมชั่นหรือแพ็กเกจเดิม
                    กรุณาตรวจยอดก่อนรับชำระ
                  </p>
                </>
              )}
              {modal.mode === "receive" && (
                <>
                  <p>
                    คงเหลือ {money(modal.b.total - modal.b.paid)} · มัดจำ{" "}
                    {money(modal.b.deposit)}
                  </p>
                  <label>
                    ยอดรับชำระ (บาท)
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={modal.b.total - modal.b.paid}
                      defaultValue={modal.b.total - modal.b.paid}
                      required
                    />
                  </label>
                  <label>
                    วิธีชำระ
                    <select name="method">
                      <option value="Cash">เงินสด</option>
                      <option value="Transfer">โอนเงิน</option>
                    </select>
                  </label>
                  <label>
                    เลขอ้างอิง / หมายเหตุ
                    <input name="reference" maxLength={100} />
                  </label>
                  <p>บันทึกเฉพาะเงินที่ตรวจสอบและรับจริงแล้ว</p>
                </>
              )}
              {modal.mode === "charges" && (
                <>
                  <label>
                    รายการค่าบริการ
                    <input name="label" maxLength={200} required />
                  </label>
                  <label>
                    จำนวนเงิน
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </label>
                </>
              )}
              {modal.mode === "checkin" && (
                <label className="rm-check">
                  <input name="verified" type="checkbox" required />
                  ตรวจสอบตัวตนผู้เข้าพักและข้อมูลการจองแล้ว
                </label>
              )}
              {modal.mode === "checkout" && (
                <p>
                  ยอดคงเหลือ {money(modal.b.total - modal.b.paid)} —
                  ต้องรับชำระครบก่อนเช็กเอาต์ ระบบจะส่งห้องไปทำความสะอาด
                </p>
              )}
              {modal.mode === "cancel" && (
                <p>ห้องจะกลับมารับการจองในช่วงนี้ เงินที่ชำระแล้วจะไม่คืนตามนโยบายปัจจุบัน</p>
              )}
              <div className="rm-form-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  ย้อนกลับ
                </button>
                <button
                  className={
                    modal.mode === "cancel" ? "cx-cancel" : "sd-primary"
                  }
                  disabled={busy}
                >
                  {busy ? "กำลังบันทึก…" : "ยืนยัน"}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </>
  );
}
export function BookingDetails({ id }) {
  const { data: b, loading, error } = useResource("/staff/bookings/" + id);
  if (loading) return <Loading layout="rows" />;
  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="rm-form">
      <div className="staff-receipt">
        <h3>{b.hotel.name}</h3>
        <p>{b.hotel.address}</p>
        <p>สรุปการจอง / การรับชำระ · {b.id}</p>
        <p>
          {b.guest_name} · {b.email} · {b.phone}
        </p>
        <p>
          ห้อง {b.room_number} · {b.check_in} — {b.check_out}
        </p>
        <hr />
        <p>
          ค่าห้อง {money(b.room_total)} · แพ็กเกจ {money(b.package_total)} · ส่วนลด{" "}
          {money(b.discount)}
        </p>
        {b.charges.map((c) => (
          <p key={c.id}>
            {c.label}: {money(c.amount)}
          </p>
        ))}
        <strong>
          รวม {money(b.total)} · รับแล้ว {money(b.paid)} · คงเหลือ{" "}
          {money(b.total - b.paid)}
        </strong>
        <h4>ประวัติรับชำระ</h4>
        {b.payments.length ? (
          b.payments.map((p) => (
            <p key={p.id}>
              #{p.id} · {p.kind} · {money(p.amount)} · {p.paid_at} UTC
            </p>
          ))
        ) : (
          <p>ยังไม่มีการรับชำระ</p>
        )}
        <p>สถานะ: {statuses[b.status]}</p>
        <p>{b.requests}</p>
      </div>
      <button onClick={() => window.print()}>พิมพ์เอกสาร / บันทึก PDF</button>
    </div>
  );
}
