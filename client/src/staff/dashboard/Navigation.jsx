import React, { useEffect, useRef } from "react";
import {
  Users,
  BrushCleaning,
  ClipboardList,
  Boxes,
  Settings,
  ChartNoAxesCombined,
  LayoutDashboard,
  CalendarDays,
  Wallet,
  BedDouble,
  Tag,
  Gift,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
const groups = [
  ["ภาพรวม", [[LayoutDashboard, "Dashboard", "all"]]],
  [
    "การปฏิบัติงาน",
    [
      [CalendarDays, "การจองและเช็กอิน/เช็กเอาต์", "front"],
      [BedDouble, "จัดการห้องพัก", "front"],
      [Users, "ข้อมูลลูกค้า", "front"],
      [BrushCleaning, "แม่บ้านและงานซ่อม", "front"],
      [Users, "ข้อมูลพนักงาน", "front"],
      [ClipboardList, "ตารางงานพนักงาน", "front"],
    ],
  ],
  [
    "การบริหาร",
    [
      [Wallet, "รายรับและการชำระเงิน", "finance"],
      [ChartNoAxesCombined, "รายงานและสถิติ", "finance"],
      [Boxes, "คลังสินค้า", "admin"],
      [BedDouble, "ประเภทห้องพัก", "admin"],
      [Settings, "ตั้งค่าโรงแรม", "admin"],
      [Tag, "โปรโมชั่น", "admin"],
      [Gift, "แพ็กเกจเสริม", "admin"],
      [ShieldCheck, "บัญชีและสิทธิ์ผู้ใช้", "admin"],
    ],
  ],
];
export function Sidebar({
  user,
  collapsed,
  setCollapsed,
  mobile,
  setMobile,
  onSelect,
  activeLabel = "Dashboard",
}) {
  const panel = useRef(null);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current.querySelector(".sd-mobile-close")?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const items = [
        ...panel.current.querySelectorAll("button,a[href]"),
      ].filter((el) => el.getClientRects().length);
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const element = panel.current;
    element.addEventListener("keydown", trap);
    return () => {
      element.removeEventListener("keydown", trap);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [mobile]);
  const allowed = (scope) =>
    scope === "all" ||
    user.role === "Admin" ||
    (scope === "front" && user.role === "Receptionist") ||
    (scope === "finance" && user.role === "Accounting");
  return (
    <>
      <button
        className={`sd-scrim ${mobile ? "open" : ""}`}
        aria-label="ปิดเมนูพนักงาน"
        onClick={() => setMobile(false)}
      />
      <aside
        ref={panel}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label="เมนูพนักงาน"
        className={`sd-sidebar ${mobile ? "open" : ""}`}
      >
        <div className="sd-brand">
          <a href="/" title="เว็บไซต์ RUENROM">
            {collapsed ? "R." : "RUENROM"}
            <small>{collapsed ? "HOTEL" : "HOTEL MANAGEMENT"}</small>
          </a>
          <button
            className="sd-icon sd-collapse"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
            aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button
            className="sd-icon sd-mobile-close"
            aria-label="ปิดเมนู"
            title="ปิดเมนู"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <nav aria-label="เมนูพนักงาน">
          {groups.map(
            ([group, items]) =>
              items.some((item) => allowed(item[2])) && (
                <div className="sd-nav-group" key={group}>
                  <p>{group}</p>
                  {items
                    .filter((item) => allowed(item[2]))
                    .map(([Icon, label]) => (
                      <button
                        key={label}
                        title={label}
                        aria-label={label}
                        aria-current={
                          label === activeLabel ? "page" : undefined
                        }
                        onClick={() => {
                          onSelect(label);
                          setMobile(false);
                        }}
                      >
                        <Icon />
                        <span>{label}</span>
                      </button>
                    ))}
                </div>
              ),
          )}
        </nav>
        <div className="sd-user">
          <span className="sd-avatar">{user.name?.slice(0, 1) || "S"}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <ShieldCheck />
        </div>
      </aside>
    </>
  );
}
export function Topbar({
  dashboard = true,
  query,
  setQuery,
  searchRef,
  period,
  setPeriod,
  dark,
  setDark,
  onProfile,
  setMobile,
}) {
  return (
    <div className="sd-topbar">
      <button
        className="sd-icon sd-menu"
        title="เปิดเมนู"
        aria-label="เปิดเมนู"
        onClick={() => setMobile(true)}
      >
        <Menu />
      </button>
      {dashboard ? (
        <label className="sd-search">
          <Search />
          <input
            ref={searchRef}
            type="search"
            aria-label="ค้นหาเลขจอง ผู้เข้าพัก หรือห้อง"
            placeholder="ค้นหาเลขจอง ผู้เข้าพัก หรือห้อง…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>Ctrl K</kbd>
        </label>
      ) : (
        <span className="sd-workspace-label">RUENROM · STAFF WORKSPACE</span>
      )}
      <div className="sd-top-actions">
        {dashboard && (
          <label className="sd-range">
            <CalendarDays />
            <select
              aria-label="ช่วงข้อมูล Dashboard"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7">7 วันล่าสุด</option>
              <option value="30">30 วันล่าสุด</option>
            </select>
          </label>
        )}
        <button
          className="sd-icon"
          title={dark ? "ใช้โหมดสว่าง" : "ใช้โหมดมืด"}
          aria-label={dark ? "ใช้โหมดสว่าง" : "ใช้โหมดมืด"}
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun /> : <Moon />}
        </button>
        <button
          className="sd-avatar"
          title="บัญชีพนักงาน"
          aria-label="บัญชีพนักงาน"
          onClick={onProfile}
        >
          R
        </button>
      </div>
    </div>
  );
}
