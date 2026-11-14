import LoadingImage from "../../components/LoadingImage";
import React from "react";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Heart,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { homeData } from "../../data/home";
import { Heading } from "../shared";
export default function InfoPage({ page, user, go }) {
  if (page === "profile")
    return (
      <>
        <Heading label="YOUR PERSONAL SPACE" title={`Hello, ${user.name}.`}>
          ข้อมูลบัญชีและการพักผ่อนของคุณ
        </Heading>
        <div className="cx-two-column">
          <section className="cx-panel">
            <h2>
              <UserRound /> ข้อมูลส่วนตัว
            </h2>
            <label>
              ชื่อ–นามสกุล
              <input readOnly value={user.name} />
            </label>
            <label>
              อีเมล
              <input readOnly value={user.email} />
            </label>
            <div className="cx-note">
              <LockKeyhole />
              <p>
                ข้อมูลบัญชีแสดงจากระบบจริง
                ขณะนี้ยังไม่รองรับการแก้ไขโปรไฟล์หรือเปลี่ยนรหัสผ่านด้วยตนเอง
              </p>
            </div>
          </section>
          <aside className="cx-panel">
            <h2>Your next moment.</h2>
            <button
              className="cx-outline cx-wide"
              onClick={() => go("/bookings")}
            >
              <CalendarDays />
              การจองของฉัน <ArrowRight />
            </button>
            <button
              className="cx-outline cx-wide"
              onClick={() => go("/favorites")}
            >
              <Heart />
              ห้องที่บันทึกไว้ <ArrowRight />
            </button>
          </aside>
        </div>
      </>
    );
  if (page === "policies")
    return (
      <>
        <Heading
          label="CLEAR DETAILS, PEACE OF MIND"
          title="A few things to know."
        >
          นโยบายการจองและการชำระเงิน
        </Heading>
        <div className="cx-policy-grid">
          {[
            [
              CalendarDays,
              "การเข้าพัก",
              "จองได้ 1–365 คืน ไม่สามารถจองวันย้อนหลังได้ จำนวนผู้เข้าพักต้องไม่เกินความจุของห้อง",
            ],
            [
              CreditCard,
              "มัดจำและยอดคงเหลือ",
              "มัดจำ 20% เพื่อยืนยันการจอง ยอดคงเหลือชำระกับพนักงานเมื่อเช็กเอาต์ ปัจจุบันการจ่ายมัดจำออนไลน์เป็นแบบจำลอง ยังไม่ตัดเงินจริง",
            ],
            [
              ShieldCheck,
              "การยกเลิก",
              "ยกเลิกได้เฉพาะการจองที่รอชำระมัดจำหรือยืนยันแล้ว เงินที่ชำระแล้วไม่คืน เมื่อเช็กอินแล้วไม่สามารถยกเลิกผ่านหน้าเว็บ",
            ],
            [
              Mail,
              "ข้อมูลและเอกสาร",
              "ข้อมูลผู้เข้าพักใช้สำหรับการจอง เอกสารที่ดาวน์โหลดจากเว็บเป็นสรุปการจอง ไม่ใช่ใบเสร็จภาษี ระบบยังไม่ส่งอีเมลยืนยันอัตโนมัติ",
            ],
          ].map(([Icon, title, text]) => (
            <section className="cx-panel" key={title}>
              <Icon />
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </div>
      </>
    );
  return (
    <>
      <Heading label="THE RUENROM WAY" title="Less rush. More room.">
        พื้นที่พักใจในกรุงเทพฯ
      </Heading>
      <LoadingImage
        className="cx-about-photo"
        src={homeData.hero}
        alt="บรรยากาศห้องพักเรือนรมย์"
      />
      <div className="cx-two-column">
        <section className="cx-section">
          <h2>
            A small hotel.
            <br />A personal kind of stay.
          </h2>
          <p>
            เรือนรมย์มีห้องพักเริ่มต้น 20 ห้อง ตั้งแต่ Classic, Deluxe, Suite ไปจนถึง
            Penthouse เลือกพื้นที่และช่วงเวลาที่เหมาะกับการพักผ่อนของคุณ
          </p>
          <button className="rr-button" onClick={() => go("/rooms")}>
            สำรวจห้องพัก <ArrowRight />
          </button>
        </section>
        <section className="cx-panel">
          <h2>
            <MapPin /> Bangkok, Thailand
          </h2>
          <p>ที่อยู่ เบอร์โทร อีเมลติดต่อ และเวลาเช็กอิน–เอาต์ของโรงแรมยังไม่ได้ระบุในระบบ</p>
          <p className="cx-caption">
            ข้อมูลเหล่านี้ต้องได้รับการยืนยันจากโรงแรมก่อนเปิดให้บริการจริง
          </p>
          <button className="cx-text" onClick={() => go("/policies")}>
            อ่านนโยบายการจอง <ArrowRight />
          </button>
        </section>
      </div>
    </>
  );
}
