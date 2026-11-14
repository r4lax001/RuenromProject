import React, { useState } from "react";
import { useResource, Loading, ErrorBox, api, day, money } from "../customer/shared";
const configs = {
  rooms: {
    number: "101",
    name: "New room",
    type: "Classic",
    price: 2400,
    capacity: 2,
    size: 32,
    image_url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
    active: true,
    is_lucky: false,
  },
  promotions: {
    code: "NEW",
    name: "Promotion",
    percent: 8,
    rule: "Member",
    start_date: day(),
    end_date: day(365),
    active: true,
  },
  packages: { name: "Package", price: 350, per_night: true, active: true },
};
const choices = {
  type: ["Classic", "Deluxe", "Suite", "Penthouse"],
  rule: ["Weekend", "EarlyBird", "Member", "Lucky", "LongStay"],
  role: ["Customer", "Admin", "Receptionist", "Accounting"],
};
const fieldLabels = {
  number: "หมายเลขห้อง",
  name: "ชื่อ",
  type: "ประเภทห้อง",
  price: "ราคา (บาท)",
  capacity: "ผู้เข้าพักสูงสุด",
  size: "ขนาดห้อง (ตร.ม.)",
  image_url: "ลิงก์รูปภาพ",
  active: "เปิดใช้งาน",
  is_lucky: "เข้าร่วมโปรโมชั่นห้องนำโชค",
  code: "รหัสโปรโมชั่น",
  percent: "ส่วนลด (%)",
  rule: "เงื่อนไขโปรโมชั่น",
  start_date: "วันที่เริ่ม",
  end_date: "วันที่สิ้นสุด",
  per_night: "คิดราคาต่อคืน",
};
export default function Management({ tab, run }) {
  const resource = useResource(tab === "status" ? "/staff/rooms" : "/admin/" + tab);
  const rows = resource.data || [];
  const load = resource.reload;
  const [edit, setEdit] = useState(null);
  async function save(e) {
    e.preventDefault();
    await run(async () => {
      const { id, ...p } = edit;
      await api("/admin/" + tab + (id ? "/" + id : ""), p, id ? "PUT" : "POST");
      setEdit(null);
      await load();
    });
  }
  if (resource.loading) return <Loading layout="rows" />;
  if (resource.error) return <ErrorBox message={resource.error} retry={load} />;
  return (
    <>
      {configs[tab] && (
        <button className="gold" onClick={() => setEdit({ ...configs[tab] })}>
          + เพิ่มข้อมูล
        </button>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>รายการ</th>
              <th>ข้อมูล</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name}
                  <small>{r.number || r.code || r.email}</small>
                </td>
                <td>
                  {r.price != null
                    ? money(r.price)
                    : r.percent != null
                      ? r.percent + "%"
                      : r.role}{" "}
                  {r.status} {r.active === 0 ? "(ปิดใช้งาน)" : ""}
                </td>
                <td>
                  {tab === "status" || tab === "rooms" ? (
                    <select
                      aria-label="สถานะห้อง"
                      value={r.status}
                      onChange={(e) => {
                        const status = e.target.value;
                        run(async () => {
                          await api(
                            "/staff/rooms/" + r.id + "/status",
                            { status },
                            "PATCH",
                          );
                          await load();
                        });
                      }}
                    >
                      {["Vacant", "Occupied", "Cleaning", "Maintenance"].map(
                        (s) => (
                          <option key={s} disabled={s === "Occupied"}>
                            {s}
                          </option>
                        ),
                      )}
                    </select>
                  ) : null}
                  {configs[tab] && (
                    <button
                      onClick={() =>
                        setEdit(
                          Object.fromEntries(
                            ["id", ...Object.keys(configs[tab])].map((k) => [
                              k,
                              typeof configs[tab][k] === "boolean"
                                ? !!r[k]
                                : r[k],
                            ]),
                          ),
                        )
                      }
                    >
                      แก้ไข
                    </button>
                  )}
                  {tab === "users" && (
                    <>
                      <select
                        aria-label="บทบาท"
                        value={r.role}
                        onChange={(e) =>
                          run(async () => {
                            await api(
                              "/admin/users/" + r.id,
                              { role: e.target.value, active: !!r.active },
                              "PATCH",
                            );
                            await load();
                          })
                        }
                      >
                        {choices.role.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          run(async () => {
                            await api(
                              "/admin/users/" + r.id,
                              { role: r.role, active: !r.active },
                              "PATCH",
                            );
                            await load();
                          })
                        }
                      >
                        {r.active ? "ปิด" : "เปิด"}ใช้งาน
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="แก้ไขข้อมูล"
          >
            <button className="close" onClick={() => setEdit(null)}>
              ปิด ×
            </button>
            <h2>
              {edit.id ? "แก้ไข" : "เพิ่ม"}
              {
                { rooms: "ห้องพัก", promotions: "โปรโมชั่น", packages: "แพ็กเกจ" }[
                  tab
                ]
              }
            </h2>
            <form onSubmit={save}>
              {Object.keys(configs[tab]).map((k) => (
                <label
                  key={k}
                  className={typeof edit[k] === "boolean" ? "check" : ""}
                >
                  {fieldLabels[k] || k}
                  {typeof edit[k] === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.checked })
                      }
                    />
                  ) : choices[k] ? (
                    <select
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.value })
                      }
                    >
                      {choices[k].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type={
                        k.endsWith("_date")
                          ? "date"
                          : typeof configs[tab][k] === "number"
                            ? "number"
                            : "text"
                      }
                      step="any"
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          [k]:
                            typeof configs[tab][k] === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
              <button className="rr-button cx-confirm">บันทึกข้อมูล</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
