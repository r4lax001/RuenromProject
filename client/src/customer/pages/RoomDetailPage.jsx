import LoadingImage from "../../components/LoadingImage";
import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Image,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Dialog } from "../../components/Home";
import { homeData } from "../../data/home";
import {
  Amenities,
  Empty,
  ErrorBox,
  Heading,
  Loading,
  money,
  nights,
  SearchForm,
  useResource,
} from "../shared";

export default function RoomDetailPage({ id, filters, go }) {
  const { data, loading, error, reload } = useResource("/rooms");
  const availability = useResource(
    "/rooms?" +
      new URLSearchParams({
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        guests: filters.guests,
      }),
  );
  const available = availability.data?.some((room) => room.id === Number(id));
  const [lightbox, setLightbox] = useState(false);
  const room = data?.find((r) => r.id === Number(id));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (!room)
    return (
      <Empty title="ไม่พบห้องพักนี้">
        <button onClick={() => go("/rooms")}>กลับไปค้นหา</button>
      </Empty>
    );
  return (
    <>
      <button className="cx-text" onClick={() => go("/rooms", filters)}>
        <ArrowLeft />
        กลับไปห้องพัก
      </button>
      <Heading label={`${room.type} · ROOM ${room.number}`} title={room.name}>
        <MapPin size={16} /> RUENROM · Bangkok
      </Heading>
      <button
        className="cx-detail-image"
        onClick={() => setLightbox(true)}
        aria-label="เปิดภาพห้องพัก"
      >
        <LoadingImage src={room.image_url} alt={room.name} />
        <span>
          <Image />
          ดูภาพห้องพัก
        </span>
      </button>
      <div className="cx-two-column">
        <div>
          <section className="cx-section">
            <span className="rr-kicker">YOUR OWN LITTLE SANCTUARY</span>
            <h2>พักสบาย ในพื้นที่ของคุณ</h2>
            <Amenities room={room} />
            <p>
              ห้อง {room.type} ขนาด {room.size} ตารางเมตร สำหรับผู้เข้าพักสูงสุด{" "}
              {room.capacity} คน เลือกวันเข้าพักเพื่อตรวจสอบห้องว่างและราคาก่อนยืนยัน
            </p>
          </section>
          <section className="cx-section">
            <h2>เลือกช่วงเวลาพักผ่อน</h2>
            <SearchForm
              filters={filters}
              onSearch={(f) => go("/room/" + id, f)}
            />
          </section>
          <section className="cx-section">
            <h2>สิ่งที่ควรทราบ</h2>
            <div className="cx-policy">
              <ShieldCheck />
              <p>มัดจำ 20% เพื่อยืนยันการจอง เงินที่ชำระแล้วไม่คืนเมื่อยกเลิก</p>
            </div>
            <button className="cx-text" onClick={() => go("/policies")}>
              อ่านนโยบายทั้งหมด <ArrowRight />
            </button>
          </section>
          <section className="cx-section">
            <h2>Guest impressions</h2>
            <Empty icon={Star} title="ยังไม่มีข้อมูลรีวิวที่ตรวจสอบแล้ว" />
          </section>
          <section className="cx-section">
            <h2>Discover Bangkok</h2>
            <LoadingImage
              className="cx-location-image"
              src={homeData.places[1].image}
              alt="บรรยากาศประเทศไทย"
            />
            <p>กรุงเทพฯ ประเทศไทย · โรงแรมยังไม่ได้ระบุที่อยู่และพิกัดที่ยืนยันแล้ว</p>
            <a
              className="cx-text"
              href="https://www.google.com/maps/search/?api=1&query=Bangkok+Thailand"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin />
              สำรวจกรุงเทพฯ บนแผนที่
            </a>
          </section>
        </div>
        <aside className="cx-panel cx-sticky">
          <span className="rr-kicker">A STAY TO REMEMBER</span>
          <h2 className="cx-price">
            {money(room.price)} <small>/ คืน</small>
          </h2>
          <p>
            <CalendarDays size={18} /> {filters.checkIn} — {filters.checkOut}
          </p>
          <div className="cx-total">
            <span>ค่าห้อง {nights(filters)} คืน</span>
            <strong>{money(room.price * nights(filters))}</strong>
          </div>
          <p className="cx-caption">ราคาแพ็กเกจและส่วนลดแสดงในขั้นตอนถัดไป</p>
          <ErrorBox message={availability.error} retry={availability.reload} />
          {availability.loading && <Loading layout="rows" label="กำลังตรวจห้องว่าง" />}
          {!availability.loading && !availability.error && !available && (
            <p role="status">
              ห้องนี้ไม่ว่างสำหรับวันที่หรือจำนวนผู้เข้าพักที่เลือก กรุณาเปลี่ยนเงื่อนไข
            </p>
          )}
          <button
            className="rr-button cx-wide"
            disabled={availability.loading || !available}
            onClick={() => go("/checkout", { ...filters, roomId: id })}
          >
            {availability.loading ? "กำลังตรวจห้องว่าง…" : "เลือกห้องนี้"}{" "}
            <ArrowRight />
          </button>
          <p className="cx-caption">ยังไม่มีการเรียกเก็บเงินในขั้นตอนนี้</p>
        </aside>
      </div>
      <div className="cx-mobile-book">
        <strong>
          {money(room.price)} <small>/ คืน</small>
        </strong>
        <button
          className="rr-button"
          disabled={availability.loading || !available}
          onClick={() => go("/checkout", { ...filters, roomId: id })}
        >
          เลือกห้องนี้ <ArrowRight />
        </button>
      </div>
      {lightbox && (
        <Dialog title={room.name} onClose={() => setLightbox(false)}>
          <LoadingImage className="cx-lightbox" src={room.image_url} alt={room.name} />
        </Dialog>
      )}
    </>
  );
}
