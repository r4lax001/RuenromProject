import React, { useState } from "react";
import { api, useResource } from "../customer/shared";
import { BookingDetails } from "./Bookings";
import { Dialog } from "../components/home/Dialog";
const configurations = {
  customers: {
    path: "customers",
    columns: {
      name: "ลูกค้า",
      email: "อีเมล",
      phone: "โทรศัพท์",
      bookings: "การจอง",
      stays: "เข้าพักแล้ว",
      note: "หมายเหตุ",
    },
    fields: { email: ["อีเมล", "email"], note: ["หมายเหตุ", "textarea"] },
    edit: true,
    method: "PUT",
  },
  employees: {
    path: "employees",
    columns: {
      name: "ชื่อ",
      department: "แผนก",
      position: "ตำแหน่ง",
      phone: "โทรศัพท์",
      active: "เปิดใช้งาน",
    },
    fields: {
      name: ["ชื่อ"],
      department: ["แผนก"],
      position: ["ตำแหน่ง"],
      phone: ["โทรศัพท์"],
      active: ["เปิดใช้งาน", "checkbox"],
    },
    create: true,
    edit: true,
  },
  shifts: {
    path: "shifts",
    columns: {
      name: "พนักงาน",
      starts_at: "เริ่มงาน",
      ends_at: "สิ้นสุด",
      clock_in: "เข้างาน",
      clock_out: "ออกงาน",
    },
    fields: {
      employeeId: ["พนักงาน", "employee"],
      startsAt: ["เริ่มงาน (เวลาไทย)", "datetime-local"],
      endsAt: ["สิ้นสุด (เวลาไทย)", "datetime-local"],
    },
    create: true,
  },
  tasks: {
    path: "tasks",
    columns: {
      room_number: "ห้อง",
      kind: "ประเภท",
      title: "งาน",
      assignee: "ผู้รับผิดชอบ",
      status: "สถานะ",
      notes: "หมายเหตุ",
    },
    fields: {
      roomId: ["ห้อง", "room"],
      kind: ["ประเภท", "kind"],
      title: ["งาน"],
      assigneeId: ["ผู้รับผิดชอบ", "employeeOptional"],
      notes: ["หมายเหตุ", "textarea"],
    },
    create: true,
    edit: true,
  },
  inventory: {
    path: "inventory",
    columns: {
      name: "สินค้า",
      quantity: "คงเหลือ",
      unit: "หน่วย",
      minimum: "แจ้งเตือนเมื่อเหลือ",
    },
    fields: {
      name: ["ชื่อสินค้า"],
      unit: ["หน่วย"],
      minimum: ["จำนวนขั้นต่ำ", "number"],
    },
    create: true,
  },
  types: {
    path: "room-types",
    columns: { name: "ประเภทห้อง", description: "รายละเอียด" },
    fields: { name: ["ประเภทห้อง"], description: ["รายละเอียด", "textarea"] },
    create: true,
    edit: true,
  },
  settings: {
    path: "settings",
    fields: {
      name: ["ชื่อโรงแรม"],
      address: ["ที่อยู่", "textarea"],
      phone: ["โทรศัพท์"],
      email: ["อีเมล", "email"],
      checkIn: ["เวลาเช็กอิน", "time"],
      checkOut: ["เวลาเช็กเอาต์", "time"],
      policy: ["นโยบายที่แสดงในเอกสาร", "textarea"],
    },
  },
};
const labels = {
  Cleaning: "ทำความสะอาด",
  Maintenance: "ซ่อมบำรุง",
  Open: "รอเริ่ม",
  InProgress: "กำลังดำเนินการ",
  Done: "เสร็จแล้ว",
};
export default function Operations({ page, user }) {
  const config = configurations[page],
    resource = useResource("/staff/" + config.path);
  const employees = useResource("/staff/employees"),
    rooms = useResource("/staff/rooms");
  const [search, setSearch] = useState(""),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const admin = user.role === "Admin",
    canWrite = admin || ["customers", "tasks"].includes(page);
  function open(row = {}, mode = "edit") {
    setError("");
    setEdit({ row, mode });
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const raw = Object.fromEntries(new FormData(e.currentTarget));
      let body = { ...raw },
        path = "/staff/" + config.path,
        method = "POST";
      for (const [key, [, type]] of Object.entries(fields)) {
        if (["number", "employee", "room"].includes(type))
          body[key] = Number(raw[key]);
        if (type === "employeeOptional")
          body[key] = raw[key] ? Number(raw[key]) : null;
        if (type === "checkbox") body[key] = raw[key] === "on";
        if (type === "datetime-local" && raw[key]?.length === 16)
          body[key] += ":00";
      }
      if (page === "settings") method = "PUT";
      if (page === "customers") {
        path += "/note";
        method = "PUT";
      }
      if (["employees", "tasks"].includes(page) && edit.row.id) {
        path += "/" + edit.row.id;
        method = "PUT";
      }
      if (page === "inventory" && edit.mode === "move")
        path += `/${edit.row.id}/move`;
      if (page === "shifts" && edit.row.id) {
        path += `/${edit.row.id}/attendance`;
        body = { action: raw.action };
      }
      await api(path, body, method);
      setEdit(null);
      resource.reload();
      setNotice("บันทึกข้อมูลแล้ว");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const fields =
    page === "tasks" && edit?.row.id
      ? {
          status: ["สถานะ", "status"],
          assigneeId: ["ผู้รับผิดชอบ", "employeeOptional"],
          notes: ["หมายเหตุ", "textarea"],
        }
      : page === "inventory" && edit?.mode === "move"
        ? {
            delta: ["รับเข้า (+) / เบิกออก (−)", "number"],
            note: ["เหตุผล / เลขเอกสาร"],
          }
        : page === "shifts" && edit?.row.id
          ? { action: ["ลงเวลา", "attendance"] }
          : config.fields;
  function input(key, label, type = "text") {
    let value =
      edit?.row[key] ??
      (key === "assigneeId"
        ? edit?.row.assignee_id
        : key === "active"
          ? true
          : "");
    const options =
      type === "kind"
        ? [
            ["Cleaning", "ทำความสะอาด"],
            ["Maintenance", "ซ่อมบำรุง"],
          ]
        : type === "status"
          ? [
              ["Open", "รอเริ่ม"],
              ["InProgress", "กำลังดำเนินการ"],
              ["Done", "เสร็จแล้ว"],
            ]
          : type === "attendance"
            ? [
                ["in", "เข้างาน"],
                ["out", "ออกงาน"],
              ]
            : type === "room"
              ? (rooms.data || []).map((r) => [r.id, `${r.number} · ${r.name}`])
              : type.startsWith("employee")
                ? (employees.data || [])
                    .filter((e) => e.active)
                    .map((e) => [e.id, e.name])
                : null;
    return (
      <label key={key} className={type === "checkbox" ? "rm-check" : ""}>
        {label}
        {options ? (
          <select
            name={key}
            defaultValue={value || ""}
            required={type !== "employeeOptional"}
          >
            <option value="">
              {type === "employeeOptional" ? "ยังไม่มอบหมาย" : "เลือก"}
            </option>
            {options.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea name={key} defaultValue={value} maxLength={2000} />
        ) : type === "checkbox" ? (
          <input name={key} type="checkbox" defaultChecked={!!value} />
        ) : (
          <input
            name={key}
            type={type}
            step={type === "number" ? "0.01" : undefined}
            defaultValue={value}
            required={!["phone", "email"].includes(key)}
            readOnly={page === "customers" && key === "email"}
          />
        )}
      </label>
    );
  }
  const rows = Array.isArray(resource.data) ? resource.data : [];
  return (
    <div className="rm-page">
      <div className="rm-toolbar">
        {page !== "settings" && (
          <label className="rm-search">
            <input
              aria-label="ค้นหารายการ"
              placeholder="ค้นหารายการ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        )}
        <button onClick={resource.reload}>อัปเดต</button>
        {canWrite && (config.create || page === "settings") && (
          <button
            className="sd-primary"
            onClick={() => open(page === "settings" ? resource.data || {} : {})}
          >
            {page === "settings" ? "แก้ไขข้อมูล" : "เพิ่มรายการ"}
          </button>
        )}
      </div>
      {notice && (
        <p role="status" className="rm-notice">
          {notice}
        </p>
      )}
      {resource.loading ? (
        <p>กำลังโหลด…</p>
      ) : resource.error ? (
        <p role="alert">{resource.error}</p>
      ) : page === "settings" ? (
        <dl>
          {Object.entries(config.fields).map(([key, [label]]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{resource.data[key] || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {Object.values(config.columns).map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) =>
                  Object.values(row)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((row, i) => (
                  <tr key={row.id || row.email || row.name || i}>
                    {Object.keys(config.columns).map((key) => (
                      <td key={key}>
                        {key === "active"
                          ? row[key]
                            ? "เปิด"
                            : "ปิด"
                          : (labels[row[key]] ?? row[key] ?? "—")}
                        {page === "inventory" &&
                          key === "quantity" &&
                          Number(row.quantity) <= Number(row.minimum) && (
                            <small>ใกล้หมด</small>
                          )}
                      </td>
                    ))}
                    <td>
                      {canWrite && config.edit && row.status !== "Done" && (
                        <button onClick={() => open(row)}>แก้ไข</button>
                      )}
                      {page === "customers" && (
                        <button onClick={() => open(row, "customerHistory")}>
                          ประวัติการจอง
                        </button>
                      )}
                      {page === "inventory" && (
                        <>
                          <button onClick={() => open(row, "move")}>
                            รับเข้า / เบิกออก
                          </button>
                          <button onClick={() => open(row, "history")}>
                            ประวัติ
                          </button>
                        </>
                      )}
                      {page === "shifts" && admin && !row.clock_out && (
                        <button onClick={() => open(row)}>ลงเวลา</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!rows.length && <p className="bo-empty">ยังไม่มีรายการ</p>}
        </div>
      )}
      {edit && (
        <Dialog
          title={
            edit.mode === "history"
              ? "ประวัติรับเข้า / เบิกออก"
              : edit.mode === "move"
                ? "บันทึกเคลื่อนไหวสินค้า"
                : "จัดการข้อมูล"
          }
          onClose={() => setEdit(null)}
          dismissible={!busy}
        >
          {edit.mode === "customerHistory" ? (
            <CustomerHistory email={edit.row.email} />
          ) : edit.mode === "history" ? (
            <StockHistory id={edit.row.id} />
          ) : (
            <form className="rm-form" onSubmit={save}>
              {error && (
                <p role="alert" className="rm-error">
                  {error}
                </p>
              )}
              {Object.entries(fields).map(([key, [label, type]]) =>
                input(key, label, type),
              )}
              <div className="rm-form-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEdit(null)}
                >
                  ยกเลิก
                </button>
                <button className="sd-primary" disabled={busy}>
                  {busy ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
}
function CustomerHistory({ email }) {
  const { data, loading, error } = useResource("/staff/bookings");
  const [selected, setSelected] = useState(null);
  if (loading) return <p>กำลังโหลด…</p>;
  if (error) return <p role="alert">{error}</p>;
  return selected ? (
    <>
      <button onClick={() => setSelected(null)}>กลับประวัติลูกค้า</button>
      <BookingDetails id={selected} />
    </>
  ) : (
    <div className="rm-form">
      {data
        .filter((b) => b.email.toLowerCase() === email.toLowerCase())
        .map((b) => (
          <button key={b.id} onClick={() => setSelected(b.id)}>
            {b.check_in} — {b.check_out} · ห้อง {b.room_number} · {b.id}
          </button>
        ))}
    </div>
  );
}
function StockHistory({ id }) {
  const { data, loading, error } = useResource(
    `/staff/inventory/${id}/history`,
  );
  return loading ? (
    <p>กำลังโหลด…</p>
  ) : error ? (
    <p role="alert">{error}</p>
  ) : (
    <div>
      {data.length ? (
        data.map((r) => (
          <p key={r.id}>
            {r.created_at} UTC · {r.delta > 0 ? "+" : ""}
            {r.delta} · {r.note} · {r.actor}
          </p>
        ))
      ) : (
        <p>ยังไม่มีการเคลื่อนไหว</p>
      )}
    </div>
  );
}
