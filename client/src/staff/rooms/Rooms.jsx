import LoadingImage from "../../components/LoadingImage";
import React, { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  Maximize,
  Pencil,
  ArrowRight,
  BedDouble,
} from "lucide-react";
import { api, useResource, money } from "../../customer/shared";
import { Dialog } from "../../components/home/Dialog";
import RoomEditor from "./RoomEditor";
import { roomStatuses } from "./roomModel";
import "./rooms.css";
export default function Rooms({ user }) {
  const resource = useResource("/staff/rooms"),
    catalog = useResource("/staff/room-types");
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [type, setType] = useState(""),
    [editor, setEditor] = useState(null),
    [change, setChange] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const rows = resource.data || [],
    admin = user.role === "Admin";
  const types = [
    ...new Set([
      ...(catalog.data || []).map((t) => t.name),
      ...rows.map((r) => r.type),
    ]),
  ].sort();
  const matches = (r, s) =>
    s === "all" || (s === "inactive" ? !r.active : r.active && r.status === s);
  const filtered = rows
    .filter(
      (r) =>
        matches(r, status) &&
        (!type || r.type === type) &&
        `${r.number} ${r.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
  async function saveStatus() {
    setBusy(true);
    setError("");
    try {
      await api(
        `/staff/rooms/${change.room.id}/status`,
        { status: change.status },
        "PATCH",
      );
      setNotice(
        `อัปเดตห้อง ${change.room.number} เป็น${roomStatuses[change.status].label}แล้ว`,
      );
      setChange(null);
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rm-page">
      <div className="rm-heading">
        <div>
          <h2>ห้องพักของโรงแรม</h2>
          <p>ดูความพร้อมของแต่ละห้อง และจัดการได้ในที่เดียว</p>
        </div>
        {admin && (
          <button className="sd-primary" onClick={() => setEditor({})}>
            <Plus />
            เพิ่มห้องพัก
          </button>
        )}
      </div>
      <div className="rm-stats" aria-label="กรองตามสถานะห้อง">
        {Object.entries(roomStatuses).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            className={`rm-stat ${status === key ? "selected" : ""}`}
            aria-pressed={status === key}
            onClick={() => setStatus(key)}
          >
            <Icon />
            <strong>
              {resource.loading
                ? "—"
                : rows.filter((r) => matches(r, key)).length}
            </strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="rm-toolbar">
        <label className="rm-search">
          <Search />
          <input
            aria-label="ค้นหาเลขห้องหรือชื่อห้อง"
            type="search"
            placeholder="ค้นหาเลขห้อง หรือชื่อห้อง"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="rm-type">
          ประเภทห้อง
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">ทุกประเภท</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          onClick={resource.reload}
          disabled={resource.loading}
          aria-label="โหลดข้อมูลห้องพักใหม่"
        >
          <RefreshCw size={18} />
          อัปเดต
        </button>
      </div>
      <div className="rm-results">
        <span>
          {roomStatuses[status].label} · {filtered.length} ห้อง
        </span>
        {(query || type || status !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setType("");
              setStatus("all");
            }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>
      {notice && (
        <p className="rm-notice" role="status">
          {notice}
        </p>
      )}
      {resource.error ? (
        <div className="rm-empty" role="alert">
          <p>{resource.error}</p>
          <button onClick={resource.reload}>ลองอีกครั้ง</button>
        </div>
      ) : resource.loading ? (
        <div className="rm-grid" aria-busy="true" aria-label="กำลังโหลดห้องพัก">
          {[1, 2, 3, 4].map((i) => (
            <div className="rm-skeleton" key={i} />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="rm-empty">
          <BedDouble size={32} />
          <h3>{rows.length ? "ไม่พบห้องที่ตรงกับตัวกรอง" : "ยังไม่มีห้องพัก"}</h3>
          <p>
            {rows.length
              ? "ลองค้นหาด้วยเลขห้อง หรือเลือกสถานะอื่น"
              : "เพิ่มห้องแรกเพื่อเริ่มเปิดรับการจอง"}
          </p>
        </div>
      ) : (
        <div className="rm-grid">
          {filtered.map((room) => {
            const state = roomStatuses[room.status] || roomStatuses.Vacant;
            return (
              <article className="rm-card" key={room.id}>
                <div className="rm-card-top">
                  <div>
                    <span className="rm-muted">ห้อง</span>
                    <h3>{room.number}</h3>
                  </div>
                  <span
                    className={`rm-status ${!room.active ? "inactive" : room.status}`}
                  >
                    <state.icon size={15} />
                    {room.active ? state.label : "ปิดใช้งาน"}
                  </span>
                </div>
                <div className="rm-room-info">
                  {room.image_url ? (
                    <LoadingImage src={room.image_url} alt="" loading="lazy" />
                  ) : (
                    <BedDouble />
                  )}
                  <div>
                    <strong>{room.name}</strong>
                    <span>{room.type}</span>
                  </div>
                </div>
                <div className="rm-specs">
                  <span>
                    <Users />
                    {room.capacity} คน
                  </span>
                  <span>
                    <Maximize />
                    {room.size} ตร.ม.
                  </span>
                </div>
                <div className="rm-price">
                  {money(room.price)}
                  <small>/ คืน</small>
                </div>
                <div className="rm-card-actions">
                  <button
                    disabled={room.status === "Occupied" || !room.active}
                    title={
                      room.status === "Occupied"
                        ? "ต้องเช็กเอาต์จากหน้าการจองก่อน"
                        : undefined
                    }
                    onClick={() => {
                      setError("");
                      setChange({ room, status: room.status });
                    }}
                  >
                    เปลี่ยนสถานะ
                    <ArrowRight size={16} />
                  </button>
                  {admin && (
                    <button
                      aria-label={`แก้ไขห้อง ${room.number}`}
                      onClick={() => setEditor(room)}
                    >
                      <Pencil size={16} />
                      แก้ไข
                    </button>
                  )}
                </div>
                {room.status === "Occupied" && (
                  <small className="rm-muted">เช็กเอาต์ได้จากเมนูการจอง</small>
                )}
              </article>
            );
          })}
        </div>
      )}
      {editor && (
        <RoomEditor
          room={editor.id ? editor : null}
          types={types}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("บันทึกข้อมูลห้องพักแล้ว");
            resource.reload();
          }}
        />
      )}
      {change && (
        <Dialog
          title={`เปลี่ยนสถานะห้อง ${change.room.number}`}
          onClose={() => setChange(null)}
          dismissible={!busy}
        >
          <div className="rm-form">
            <p>สถานะปัจจุบัน: {roomStatuses[change.room.status]?.label}</p>
            {error && (
              <p role="alert" className="rm-error">
                {error}
              </p>
            )}
            <div className="rm-status-options">
              {["Vacant", "Cleaning", "Maintenance"].map((s) => (
                <label key={s}>
                  <input
                    type="radio"
                    name="room-status"
                    value={s}
                    checked={change.status === s}
                    onChange={() => setChange({ ...change, status: s })}
                  />
                  {roomStatuses[s].label}
                </label>
              ))}
            </div>
            <p className="rm-muted">
              ห้องที่ทำความสะอาดหรือซ่อมบำรุงจะไม่เปิดรับการจองใหม่
            </p>
            <div className="rm-form-actions">
              <button disabled={busy} onClick={() => setChange(null)}>
                ยกเลิก
              </button>
              <button
                className="sd-primary"
                disabled={busy || change.status === change.room.status}
                onClick={saveStatus}
              >
                {busy ? "กำลังบันทึก…" : "ยืนยันเปลี่ยนสถานะ"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
