import { useEffect, useRef, useState } from "react";
import { useResource } from "../../customer/hooks/useResource";
import { api } from "../../customer/lib/api";
import "./reviews.css";
import HomeSkeleton from "./HomeSkeleton";

const portraitColors = [
  ["#d8e9e4", "#534038", "#517b74"],
  ["#ede2cf", "#493629", "#90704a"],
  ["#e4dfee", "#382e35", "#736589"],
];

function ReviewCard({ review, copy }) {
  const variant = Array.from(review.name).reduce((sum, c) => sum + c.codePointAt(0), 0) % portraitColors.length;
  const [background, hair, shirt] = portraitColors[variant];
  return (
    <article aria-hidden={copy || undefined} className={copy ? "rr-review-copy" : undefined}>
      <header className="rr-review-author">
        <svg className="rr-review-avatar" viewBox="0 0 48 48" aria-hidden="true">
          <rect width="48" height="48" rx="24" fill={background} />
          <path d="M4 50q2-16 20-16t20 16" fill={shirt} />
          <ellipse cx="24" cy="22" rx="10" ry="13" fill="#dca982" />
          <path d={variant === 1 ? "M13 23Q9 6 24 7q14 0 11 17-3-4-5-11-6 8-17 10" : "M13 22Q10 6 24 7q13 0 11 15-5-2-7-8-6 5-15 8"} fill={hair} />
          <g fill="#49372f"><circle cx="20" cy="23" r="1"/><circle cx="28" cy="23" r="1"/></g>
          <path d="M21 28q3 3 6 0" fill="none" stroke="#815144" strokeLinecap="round" />
        </svg>
        <strong>{review.name}</strong>
      </header>
      <div className="rr-review-stars" aria-label={review.rating + " จาก 5 ดาว"}>
        <span aria-hidden="true">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
      </div>
      <blockquote>{review.body}</blockquote>
    </article>
  );
}

function ReviewStrip({ reviews }) {
  const strip = useRef(null);
  const [slots, setSlots] = useState(4);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const cardWidth = Math.min(width * 0.84, 350);
      setSlots(Math.max(1, Math.ceil(width / (cardWidth + 16))));
    });
    observer.observe(strip.current);
    return () => observer.disconnect();
  }, []);
  const copies = Math.ceil(slots / reviews.length);
  const items = Array.from({ length: copies }, () => reviews).flat();
  return (
    <div ref={strip} className="rr-review-list" role="region" aria-label="รีวิวล่าสุด" tabIndex={0}>
      <div className="rr-review-track" style={{ animationDuration: items.length * 11 + "s" }}>
        {[false, true].map(duplicate => (
          <div key={String(duplicate)} className="rr-review-group" aria-hidden={duplicate || undefined}>
            {items.map((review, i) => <ReviewCard key={i} review={review} copy={duplicate || i >= reviews.length} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reviews({ user }) {
  const reviews = useResource("/reviews");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = fields.get("body").trim();
    setError("");
    if (!body) {
      setError("กรุณาเขียนข้อความรีวิว");
      return;
    }
    setBusy(true);
    try {
      await api("/reviews", { rating: Number(fields.get("rating")), body });
      setOpen(false);
      setNotice("เผยแพร่รีวิวของคุณแล้ว");
      reviews.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rr-reviews" id="reviews" aria-labelledby="reviews-heading">
      <div className="rr-section rr-review-intro">
        <div className="rr-section-heading">
          <h2 id="reviews-heading">เสียงจากลูกค้า</h2>
          {user?.role === "Customer" && (
            <button className="rr-text-button" aria-expanded={open} disabled={busy}
              onClick={() => { setOpen(!open); setNotice(""); setError(""); }}>
              {open ? "ปิดฟอร์ม" : "เขียนรีวิว"}
            </button>
          )}
          {!user && <a className="rr-text-button" href="/login?returnTo=/">เข้าสู่ระบบเพื่อเขียนรีวิว</a>}
        </div>
        {open && user?.role === "Customer" && (
          <form onSubmit={submit}>
            <label>คะแนน
              <select name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ดาว</option>)}
              </select>
            </label>
            <label>รีวิวของคุณ
              <textarea name="body" maxLength={500} required rows={3} />
            </label>
            <small>เผยแพร่บนหน้าแรกในชื่อ {user.name}</small>
            {error && <p role="alert">{error}</p>}
            <button className="rr-button" disabled={busy}>{busy ? "กำลังส่ง…" : "เผยแพร่รีวิว"}</button>
          </form>
        )}
        <div role="status">{notice}</div>
        {reviews.error && <p role="alert">{reviews.error} <button onClick={reviews.reload}>ลองอีกครั้ง</button></p>}
        {reviews.data?.length === 0 && <p>ยังไม่มีรีวิว มาเล่าประสบการณ์ของคุณเป็นคนแรก</p>}
      </div>
      {reviews.loading && <HomeSkeleton reviews />}
      {reviews.data?.length > 0 && <ReviewStrip reviews={reviews.data} />}
    </section>
  );
}
