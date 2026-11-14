import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Coffee,
  Landmark,
  MapPin,
  MoveUpRight,
  ShieldCheck,
  Tag,
  Waves,
  Headset,
} from "lucide-react";
import { homeData } from "../data/home";
import { useResource } from "../customer/hooks/useResource";
import "./home.css";

const today = (offset = 0) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offset * 86400000));

import { Dialog } from "./home/Dialog";
import SearchBar from "./home/SearchBar";
import RoomCard from "./home/FeaturedRoomCard";
export { Dialog } from "./home/Dialog";
export { HomeHeader } from "./home/HomeHeader";
export default function Home({ onSearch }) {
  const featured = useResource("/rooms");
  const featuredRooms = homeData.rooms.flatMap((template) => {
    const room = featured.data
      ?.filter((r) => r.type === template.type)
      .sort((a, b) => a.price - b.price)[0];
    return room
      ? [
          {
            ...template,
            name: room.name,
            price: room.price,
            size: room.size,
            guests: room.capacity,
            image: room.image_url,
          },
        ]
      : [];
  });
  const [place, setPlace] = useState(null);
  const root = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.current
      .querySelectorAll(".rr-reveal")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="rr-home" ref={root}>
      <section className="rr-hero">
        <img
          className="rr-hero-photo"
          src={homeData.hero}
          alt="ห้องพักแสงอบอุ่นกับเตียงนุ่มสำหรับวันพักผ่อน"
          fetchPriority="high"
        />
        <div className="rr-hero-shade" />
        <div className="rr-hero-content">
          <div className="rr-kicker rr-light-label">
            <span /> A QUIETER SIDE OF BANGKOK
          </div>
          <h1>
            Somewhere to stay.
            <br />
            <em>Somewhere to belong.</em>
          </h1>
          <p>พักกาย วางใจ ให้ทุกช่วงเวลาเป็นของคุณ</p>
          <a className="rr-hero-link" href="#rr-stays">
            ค้นพบการพักผ่อนของคุณ <ArrowRight />
          </a>
        </div>
        <div className="rr-hero-bottom">
          <span>THOUGHTFULLY DESIGNED. PERSONALLY YOURS.</span>
          <span>
            20 ROOMS <span className="rr-slide-line" /> ONE RETREAT
          </span>
        </div>
      </section>
      <div className="rr-search-wrap">
        <SearchBar onSearch={onSearch} />
        <div className="rr-search-note">
          <ShieldCheck /> จองตรงกับเรือนรมย์ <span /> มัดจำเพียง 20% <span />{" "}
          ราคาชัดเจนก่อนยืนยัน
        </div>
      </div>
      <section className="rr-section rr-reveal" id="rr-stays">
        <div className="rr-section-heading">
          <div>
            <div className="rr-kicker">THE ART OF REST</div>
            <h2>A stay, just your style.</h2>
            <p>พื้นที่เล็ก ๆ สำหรับการพักผ่อนที่พอดีกับคุณ</p>
          </div>
          <button className="rr-text-button" onClick={() => onSearch()}>
            ดูห้องพักทั้งหมด <ArrowUpRight />
          </button>
        </div>
        <div className="rr-room-grid">
          {featured.loading && <p role="status">กำลังโหลดห้องพัก…</p>}
          {featured.error && (
            <p role="alert">
              โหลดห้องพักไม่สำเร็จ <button onClick={featured.reload}>ลองใหม่</button>
            </p>
          )}
          {featuredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelect={() =>
                onSearch({
                  checkIn: today(),
                  checkOut: today(1),
                  guests: 2,
                  type: room.type,
                })
              }
            />
          ))}
        </div>
      </section>
      <section className="rr-neighborhood" id="rr-neighborhood">
        <div className="rr-section rr-reveal">
          <div className="rr-section-heading">
            <div>
              <div className="rr-kicker">BEYOND YOUR ROOM</div>
              <h2>A city worth slowing down for.</h2>
              <p>อีกมุมของกรุงเทพฯ ที่อยากให้คุณได้รู้จัก</p>
            </div>
            <span className="rr-location-label">
              <MapPin /> BANGKOK, THAILAND
            </span>
          </div>
          <div className="rr-place-grid">
            {homeData.places.map((p) => {
              const Icon = { waves: Waves, landmark: Landmark, coffee: Coffee }[
                p.icon
              ];
              return (
                <button
                  className="rr-place"
                  key={p.name}
                  onClick={() => setPlace(p)}
                >
                  <img src={p.image} alt={p.thai} loading="lazy" />
                  <span className="rr-place-shade" />
                  <span className="rr-place-content">
                    <Icon />
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.thai}</small>
                    </span>
                    <MoveUpRight />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <section className="rr-trust rr-section rr-reveal">
        <div className="rr-kicker">LITTLE DETAILS. A BETTER STAY.</div>
        <div className="rr-trust-grid">
          {[
            [ShieldCheck, "จองอย่างมั่นใจ", "ข้อมูลการจองอยู่ในบัญชีคุณ"],
            [Tag, "ราคาที่ชัดเจน", "เห็นยอดรวมก่อนยืนยัน"],
            [Headset, "ดูแลด้วยความใส่ใจ", "ทีมต้อนรับพร้อมดูแลการเข้าพัก"],
            [CalendarDays, "วางแผนได้สบาย", "ตรวจสอบวันว่างก่อนจอง"],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="rr-footer">
        <div className="rr-footer-main">
          <div>
            <a className="rr-logo" href="#">
              <span>RUENROM.</span>
              <small>BOUTIQUE HOTEL · BANGKOK</small>
            </a>
            <p>A little closer to feeling at home.</p>
          </div>
          <div className="rr-footer-links">
            <a href="/about">เกี่ยวกับโรงแรม</a>
            <a href="/policies">นโยบายการจอง</a>
            <a href="#rr-stays">ห้องพัก</a>
            <a href="#rr-neighborhood">ค้นพบกรุงเทพฯ</a>
            <button onClick={() => onSearch()}>
              เริ่มต้นการพักผ่อน <ArrowUpRight />
            </button>
          </div>
        </div>
        <div className="rr-footer-bottom">
          <span>© {new Date().getFullYear()} RUENROM HOTEL</span>
          <span>MADE FOR SLOWER MOMENTS.</span>
          <span>กรุงเทพฯ ประเทศไทย</span>
        </div>
      </footer>
      {place && (
        <Dialog title={place.name} onClose={() => setPlace(null)}>
          <img className="rr-dialog-photo" src={place.image} alt={place.thai} />
          <p>{place.description}</p>
          <a
            className="rr-button"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.thai + " กรุงเทพ")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin />
            สำรวจบนแผนที่ <ArrowUpRight />
          </a>
        </Dialog>
      )}
    </div>
  );
}
