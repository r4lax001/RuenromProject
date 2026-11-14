import React, { useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { Dialog } from "../../components/home/Dialog";
import { api } from "../../customer/shared";
import { emptyRoom, roomPayload } from "./roomModel";
export default function RoomEditor({ room, types, onClose, onSaved }) {
  const [form, setForm] = useState(
    room ? roomPayload(room) : { ...emptyRoom, type: types[0] || "Classic" },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function upload(file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("เลือกรูป JPEG หรือ PNG ขนาดไม่เกิน 2 MB");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await api("/staff/room-image", { data });
      change("image_url", result.url);
    } catch (e) {
      setError(e.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/admin/rooms" + (room ? "/" + room.id : ""),
        form,
        room ? "PUT" : "POST",
      );
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (key, label, type = "text", props = {}) => (
    <label>
      {label}
      <input
        required
        type={type}
        value={form[key]}
        onChange={(e) =>
          change(
            key,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
        {...props}
      />
    </label>
  );
  return (
    <Dialog
      title={room ? `แก้ไขห้อง ${room.number}` : "เพิ่มห้องพัก"}
      onClose={onClose}
      dismissible={!busy}
    >
      <form className="rm-form" onSubmit={save}>
        <p className="rm-muted">ข้อมูลนี้จะแสดงในหน้าจองห้องพักของลูกค้า</p>
        {error && (
          <p role="alert" className="rm-error">
            {error}
          </p>
        )}
        <fieldset disabled={busy}>
          <legend>ข้อมูลห้องพัก</legend>
          <div className="rm-form-grid">
            {field("number", "เลขห้อง", "text", { maxLength: 10 })}
            {field("name", "ชื่อห้อง", "text", { maxLength: 120 })}
            <label>
              ประเภทห้อง
              <select
                value={form.type}
                onChange={(e) => change("type", e.target.value)}
              >
                {[...new Set([...types, form.type])].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {field("size", "ขนาดห้อง (ตร.ม.)", "number", { min: 1, step: 1 })}
            {field("capacity", "ผู้เข้าพักสูงสุด (คน)", "number", {
              min: 1,
              max: 10,
              step: 1,
            })}
            {field("price", "ราคาต่อคืน (บาท)", "number", {
              min: 0.01,
              max: 1000000,
              step: 0.01,
            })}
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>รูปห้องพัก</legend>
          <div className="rm-upload">
            {form.image_url ? (
              <img src={form.image_url} alt="ตัวอย่างรูปห้อง" />
            ) : (
              <ImagePlus size={32} />
            )}
            <label>
              เลือกรูปภาพ
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => upload(e.target.files[0])}
              />
              <small>JPEG / PNG ไม่เกิน 2 MB</small>
            </label>
          </div>
          {field("image_url", "หรือลิงก์รูปภาพ", "text", {
            placeholder: "https://…",
          })}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>การเปิดขาย</legend>
          <label className="rm-check">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => change("active", e.target.checked)}
            />
            เปิดใช้งานห้องพัก
          </label>
          <label className="rm-check">
            <input
              type="checkbox"
              checked={form.is_lucky}
              onChange={(e) => change("is_lucky", e.target.checked)}
            />
            เข้าร่วมโปรโมชั่นห้องนำโชค
          </label>
        </fieldset>
        <div className="rm-form-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            ยกเลิก
          </button>
          <button className="sd-primary" disabled={busy}>
            <Save size={18} />
            {busy ? "กำลังบันทึก…" : "บันทึกห้องพัก"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
