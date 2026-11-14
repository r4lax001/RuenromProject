import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  api,
  Empty,
  ErrorBox,
  Heading,
  Loading,
  money,
  useResource,
} from "../shared";

export function Steps({ step = 0 }) {
  return (
    <ol className="cx-steps">
      {[
        [UserRound, "ข้อมูลผู้เข้าพัก"],
        [CreditCard, "มัดจำ"],
        [Check, "ยืนยัน"],
      ].map(([Icon, label], i) => (
        <li key={label} className={i <= step ? "is-active" : ""}>
          <Icon />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
export function PriceSummary({ quote }) {
  return (
    <dl className="cx-breakdown">
      <div>
        <dt>ค่าห้อง {quote.nights ? `(${quote.nights} คืน)` : ""}</dt>
        <dd>{money(quote.roomTotal)}</dd>
      </div>
      <div>
        <dt>แพ็กเกจ</dt>
        <dd>{money(quote.packageTotal)}</dd>
      </div>
      <div>
        <dt>ส่วนลด</dt>
        <dd>−{money(quote.discount)}</dd>
      </div>
      <div className="cx-total">
        <dt>ยอดรวม</dt>
        <dd>{money(quote.total)}</dd>
      </div>
      <div>
        <dt>มัดจำ 20%</dt>
        <dd>{money(quote.deposit)}</dd>
      </div>
      <div>
        <dt>ยอดที่เหลือหลังมัดจำ</dt>
        <dd>{money(quote.total - quote.deposit)}</dd>
      </div>
    </dl>
  );
}

export default function CheckoutPage({ id, filters, user, go }) {
  const rooms = useResource("/rooms");
  const catalog = useResource("/catalog");
  const [promotionId, setPromotion] = useState("");
  const [packageIds, setPackages] = useState([]);
  const [quote, setQuote] = useState(null);
  const [pricedInput, setPricedInput] = useState("");
  const [retryPrice, setRetryPrice] = useState(0);
  const [pricing, setPricing] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const room = rooms.data?.find((r) => r.id === Number(id));
  const input = {
    roomId: Number(id),
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: filters.guests,
    promotionId: promotionId ? Number(promotionId) : null,
    packageIds,
  };
  const inputKey = JSON.stringify(input);
  const currentQuote = quote && pricedInput === inputKey;
  useEffect(() => {
    const c = new AbortController();
    setQuote(null);
    setPricing(true);
    setError("");
    api("/quote", input, "POST", c.signal)
      .then((value) => {
        if (!c.signal.aborted) {
          setQuote(value);
          setPricedInput(inputKey);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setPricing(false);
      });
    return () => c.abort();
  }, [
    id,
    filters.checkIn,
    filters.checkOut,
    filters.guests,
    promotionId,
    JSON.stringify(packageIds),
    user?.id,
    retryPrice,
  ]);
  if (rooms.loading || catalog.loading) return <Loading />;
  if (rooms.error || catalog.error)
    return (
      <ErrorBox
        message={rooms.error || catalog.error}
        retry={() => {
          rooms.reload();
          catalog.reload();
        }}
      />
    );
  if (!room)
    return (
      <Empty title="ไม่พบห้องที่เลือก">
        <button onClick={() => go("/rooms", filters)}>เลือกห้องใหม่</button>
      </Empty>
    );
  return (
    <>
      <button className="cx-text" onClick={() => go("/room/" + id, filters)}>
        <ArrowLeft />
        กลับไปดูห้อง
      </button>
      <Heading label="YOUR STAY, ALMOST READY" title="A few little details.">
        ตรวจสอบรายละเอียดก่อนสร้างการจอง
      </Heading>
      <Steps />
      <div className="cx-two-column cx-checkout-layout">
        <form
          className="cx-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting.current || !currentQuote || pricing) return;
            const fields = Object.fromEntries(new FormData(e.currentTarget));
            submitting.current = true;
            setBusy(true);
            setError("");
            try {
              const result = await api("/bookings", {
                ...input,
                ...fields,
                acceptPolicy: fields.acceptPolicy === "on",
              });
              go("/payment/" + result.id);
            } catch (e) {
              setError(e.message);
            } finally {
              submitting.current = false;
              setBusy(false);
            }
          }}
        >
          <h2>ข้อมูลผู้เข้าพัก</h2>
          <p className="cx-caption">
            จองในนาม {user.name} · {filters.guests} ผู้เข้าพัก
          </p>
          <div className="cx-form-grid">
            <label>
              ชื่อ–นามสกุล
              <input
                name="guestName"
                required
                maxLength={120}
                defaultValue={user.name}
                autoComplete="name"
              />
            </label>
            <label>
              อีเมล
              <input
                name="email"
                type="email"
                required
                maxLength={190}
                defaultValue={user.email}
                autoComplete="email"
              />
            </label>
            <label>
              เบอร์โทรศัพท์
              <input
                name="phone"
                type="tel"
                required
                pattern={String.raw`[+0-9 \(\)\-]{8,30}`}
                title="ใช้ตัวเลข เครื่องหมาย + วงเล็บ ช่องว่าง หรือขีด จำนวน 8–30 ตัวอักษร"
                minLength={8}
                maxLength={30}
                autoComplete="tel"
              />
            </label>
          </div>
          <label>
            คำขอเพิ่มเติม <small>(ถ้ามี)</small>
            <textarea
              name="requests"
              rows={3}
              maxLength={2000}
              placeholder="คำขอขึ้นอยู่กับความพร้อมของโรงแรม"
            />
          </label>
          <div className="cx-divider" />
          <h2>A little extra.</h2>
          <label>
            โปรโมชั่น
            <select
              value={promotionId}
              onChange={(e) => setPromotion(e.target.value)}
            >
              <option value="">ไม่ใช้โปรโมชั่น</option>
              {catalog.data.promotions.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} · {p.percent}%
                </option>
              ))}
            </select>
          </label>
          <div className="cx-extras">
            {catalog.data.packages.map((p) => (
              <label className="cx-check" key={p.id}>
                <input
                  type="checkbox"
                  checked={packageIds.includes(p.id)}
                  onChange={(e) =>
                    setPackages(
                      e.target.checked
                        ? [...packageIds, p.id]
                        : packageIds.filter((id) => id !== p.id),
                    )
                  }
                />
                <span>
                  {p.name}
                  <small>
                    {money(p.price)} / คน {p.per_night ? "/ คืน" : "/ ครั้ง"}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <div className="cx-divider" />
          <label className="cx-check">
            <input name="acceptPolicy" type="checkbox" required />
            <span>
              ยอมรับมัดจำ 20% และไม่คืนเงินเมื่อยกเลิก{" "}
              <button
                className="cx-text"
                type="button"
                onClick={() =>
                  window.open("/policies", "_blank", "noopener,noreferrer")
                }
              >
                อ่านนโยบาย
              </button>
            </span>
          </label>
          <ErrorBox
            message={error}
            retry={!busy ? () => setRetryPrice((n) => n + 1) : undefined}
          />
          <button
            className="rr-button cx-confirm cx-wide"
            disabled={busy || pricing || !currentQuote}
          >
            {busy ? "กำลังสร้างการจอง…" : "สร้างการจองและไปหน้ามัดจำ"}
            <ArrowRight />
          </button>
          <p className="cx-caption">
            <ShieldCheck size={16} /> ขั้นตอนนี้ยังไม่ตัดเงิน · การมัดจำปัจจุบันเป็นแบบจำลอง
          </p>
        </form>
        <aside className="cx-panel cx-sticky">
          <img
            className="cx-summary-image"
            src={room.image_url}
            alt={room.name}
          />
          <span className="rr-kicker">YOUR RESERVATION</span>
          <h2>{room.name}</h2>
          <p>
            ห้อง {room.number} · {filters.guests} คน
          </p>
          <p>
            {filters.checkIn} → {filters.checkOut}
          </p>
          {pricing ? (
            <p role="status">กำลังตรวจสอบราคาและห้องว่าง…</p>
          ) : quote ? (
            <PriceSummary quote={quote} />
          ) : (
            <p>ยังไม่สามารถยืนยันราคาได้ กรุณาตรวจสอบเงื่อนไขการจอง</p>
          )}
          <p className="cx-caption">
            ยอดตามระบบโรงแรม ไม่มีรายการภาษีหรือค่าธรรมเนียมเพิ่มแยกในระบบปัจจุบัน
          </p>
        </aside>
      </div>
    </>
  );
}
