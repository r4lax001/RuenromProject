import React, { useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Download,
  Share2,
  ShieldCheck,
  CircleX,
  TriangleAlert,
} from "lucide-react";
import { Dialog } from "../../components/Home";
import {
  api,
  Empty,
  ErrorBox,
  Heading,
  Loading,
  money,
  useResource,
} from "../shared";
import { BookingStatus } from "./BookingsPage";
import { PriceSummary, Steps } from "./CheckoutPage";
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BookingDetailPage({ id, mode, user, go }) {
  const { data, loading, error, reload } = useResource("/bookings");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [cancel, setCancel] = useState(false);
  const [notice, setNotice] = useState("");
  const b = data?.find((b) => b.id === id && b.user_id === user.id);
  async function action(kind) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await api(`/bookings/${id}/${kind}`, {});
      setCancel(false);
      if (kind === "deposit") go("/confirmation/" + id);
      else reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading layout="rows" />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!b)
    return (
      <Empty title="ไม่พบการจองในบัญชีนี้">
        <button onClick={() => go("/bookings")}>ดูการจองของฉัน</button>
      </Empty>
    );
  const paid = ["Confirmed", "CheckedIn", "Completed"].includes(b.status);
  const payment = mode === "payment" && b.status === "Pending";
  return (
    <>
      <Heading
        label={payment ? "ONE MORE LITTLE STEP" : "YOUR RUENROM STAY"}
        title={
          payment
            ? "Your stay is reserved."
            : paid
              ? "See you at Ruenrom."
              : "Your reservation."
        }
      >
        {payment
          ? "สร้างการจองแล้ว ชำระมัดจำเพื่อยืนยันห้องพัก"
          : "รายละเอียดล่าสุดจากระบบโรงแรม"}
      </Heading>
      {mode !== "booking" && <Steps step={paid ? 2 : 1} />}
      <div className="cx-two-column">
        <section className="cx-panel cx-booking-details">
          {paid && <CheckCircle2 className="cx-success-icon" />}
          <BookingStatus status={b.status} />
          <p className="rr-kicker">BOOKING REFERENCE</p>
          <h2 className="cx-reference">{b.id}</h2>
          <div className="cx-detail-grid">
            <div>
              <small>ห้องพัก</small>
              <strong>
                {b.room_name} · {b.room_number}
              </strong>
            </div>
            <div>
              <small>ผู้เข้าพัก</small>
              <strong>
                {b.guest_name} · {b.guests} คน
              </strong>
            </div>
            <div>
              <small>เช็กอิน</small>
              <strong>{b.check_in}</strong>
            </div>
            <div>
              <small>เช็กเอาต์</small>
              <strong>{b.check_out}</strong>
            </div>
            <div>
              <small>อีเมล</small>
              <strong>{b.email}</strong>
            </div>
            <div>
              <small>โทรศัพท์</small>
              <strong>{b.phone}</strong>
            </div>
          </div>
          {b.requests && <p>คำขอเพิ่มเติม: {b.requests}</p>}
          <p className="cx-caption">
            แพ็กเกจ:{" "}
            {(Array.isArray(b.packages) ? b.packages : []).join(", ") || "ไม่มี"}
          </p>
          <div className="cx-divider" />
          {payment ? (
            <>
              <h2>
                <CreditCard /> ชำระมัดจำ
              </h2>
              <div className="cx-note">
                <ShieldCheck />
                <p>
                  โหมดสาธิต: ไม่มีการตัดเงินจริง
                  การจำลองจะใช้งานได้เฉพาะเมื่อโรงแรมเปิดโหมดสาธิต
                  ระบบยังไม่รับข้อมูลบัตรหรือโอนเงินจริง
                </p>
              </div>
              <button
                disabled={busy}
                className="rr-button cx-confirm cx-wide"
                onClick={() => action("deposit")}
              >
                {busy ? "กำลังตรวจสอบ…" : `จำลองชำระมัดจำ ${money(b.deposit)}`}
              </button>
              <button className="cx-text" onClick={() => go("/booking/" + id)}>
                ชำระภายหลัง
              </button>
            </>
          ) : (
            <div className="cx-actions">
              {b.status === "Pending" && (
                <button
                  className="rr-button"
                  onClick={() => go("/payment/" + id)}
                >
                  <CreditCard />
                  ไปหน้ามัดจำ
                </button>
              )}
              <button
                className="cx-outline"
                onClick={() =>
                  download(
                    id + ".txt",
                    `RUENROM HOTEL\nเอกสารสรุปการจอง (ไม่ใช่ใบเสร็จภาษี)\n${b.id}\n${b.room_name} ห้อง ${b.room_number}\n${b.check_in} - ${b.check_out}\n${b.guest_name}\nสถานะ: ${b.status}\nยอดรวม: ${money(b.total)}\nชำระแล้ว: ${money(b.paid)}`,
                    "text/plain;charset=utf-8",
                  )
                }
              >
                <Download />
                ดาวน์โหลดสรุป
              </button>
              <button className="cx-outline" onClick={() => window.print()}>
                <Download />
                พิมพ์ / PDF
              </button>
              {b.status !== "Cancelled" && (
                <button
                  className="cx-outline"
                  onClick={() =>
                    download(
                      id + ".ics",
                      [
                        "BEGIN:VCALENDAR",
                        "VERSION:2.0",
                        "PRODID:-//Ruenrom//Booking//TH",
                        "BEGIN:VEVENT",
                        `UID:${id}@ruenrom.local`,
                        `DTSTAMP:${new Date()
                          .toISOString()
                          .replace(/[-:]/g, "")
                          .replace(/\.\d{3}/, "")}`,
                        `DTSTART;VALUE=DATE:${b.check_in.replaceAll("-", "")}`,
                        `DTEND;VALUE=DATE:${b.check_out.replaceAll("-", "")}`,
                        "SUMMARY:RUENROM HOTEL stay",
                        "END:VEVENT",
                        "END:VCALENDAR",
                      ].join("\r\n"),
                      "text/calendar",
                    )
                  }
                >
                  <CalendarPlus />
                  เพิ่มลงปฏิทิน
                </button>
              )}
              <button
                className="cx-outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${location.origin}/booking/${id}`,
                    );
                    setNotice("คัดลอกลิงก์แล้ว เปิดดูได้เฉพาะบัญชีเจ้าของการจอง");
                  } catch {
                    setNotice("คัดลอกลิงก์จากแถบที่อยู่ของเบราว์เซอร์ได้โดยตรง");
                  }
                }}
              >
                <Share2 />
                คัดลอกลิงก์
              </button>
            </div>
          )}
          <ErrorBox message={actionError} />
          {notice && <p role="status">{notice}</p>}
        </section>
        <aside className="cx-panel cx-sticky">
          <h2>Your stay, in detail.</h2>
          <PriceSummary
            quote={{
              roomTotal: b.room_total,
              packageTotal: b.package_total,
              discount: b.discount,
              total: b.total,
              deposit: b.deposit,
            }}
          />
          <div className="cx-total">
            <span>ชำระแล้ว</span>
            <strong>{money(b.paid)}</strong>
          </div>
          <div className="cx-total">
            <span>
              {b.status === "Cancelled" ? "ยอดที่ไม่ได้เรียกเก็บ" : "ยอดคงเหลือ"}
            </span>
            <strong>{money(b.total - b.paid)}</strong>
          </div>
          <p className="cx-caption">เงินที่ชำระแล้วไม่คืนเมื่อยกเลิก</p>
          {["Pending", "Confirmed"].includes(b.status) && (
            <button
              className="cx-cancel cx-wide"
              onClick={() => setCancel(true)}
            >
              <CircleX aria-hidden="true" />
              ยกเลิกการจองนี้
            </button>
          )}
          <button
            className="cx-outline cx-wide"
            onClick={() => go("/bookings")}
          >
            กลับไปการจองของฉัน
          </button>
        </aside>
      </div>
      {cancel && (
        <Dialog
          title="ยกเลิกการจองนี้?"
          dismissible={!busy}
          onClose={() => setCancel(false)}
        >
          <p>
            ห้องพักจะถูกปล่อยให้จองใหม่ และยอดที่ชำระแล้ว {money(b.paid)} จะไม่คืน
            การยกเลิกไม่สามารถย้อนกลับได้
          </p>
          <ErrorBox message={actionError} />
          <div className="cx-actions cx-confirm-actions">
            <button
              className="cx-outline"
              disabled={busy}
              onClick={() => setCancel(false)}
            >
              <ShieldCheck aria-hidden="true" />
              เก็บการจองไว้
            </button>
            <button
              className="rr-button cx-danger"
              disabled={busy}
              onClick={() => action("cancel")}
            >
              <TriangleAlert aria-hidden="true" />
              {busy ? "กำลังยกเลิก…" : "ยืนยันยกเลิก"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
