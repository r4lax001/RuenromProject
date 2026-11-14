import React, { useState, useRef, useEffect } from "react";
import { DoorOpen, BedDouble, LogIn, LogOut, Download } from "lucide-react";
import { api, useResource } from "../../customer/shared";
import { Dialog } from "../../components/home/Dialog";
import { Sidebar, Topbar } from "./Navigation";
import {
  KpiCard,
  RevenueChart,
  WeekdayBars,
  OccupancyGauge,
  RoomStatusStrip,
  BookingsTable,
  DashboardSkeleton,
} from "./Widgets";
import Bookings, { BookingDetails } from "../Bookings";
import Rooms from "../rooms/Rooms";
import Management from "../Management";
import Payments from "../Payments";
import Operations from "../Operations";
import "./dashboard.css";
const pages = {
  dashboard: "Dashboard",
  bookings: "การจองและเช็กอิน/เช็กเอาต์",
  rooms: "จัดการห้องพัก",
  customers: "ข้อมูลลูกค้า",
  tasks: "แม่บ้านและงานซ่อม",
  employees: "ข้อมูลพนักงาน",
  shifts: "ตารางงานพนักงาน",
  inventory: "คลังสินค้า",
  types: "ประเภทห้องพัก",
  settings: "ตั้งค่าโรงแรม",
  payments: "รายรับและการชำระเงิน",
  reports: "รายงานและสถิติ",
  promotions: "โปรโมชั่น",
  packages: "แพ็กเกจเสริม",
  users: "บัญชีและสิทธิ์ผู้ใช้",
};
export default function StaffDashboard({ user, run }) {
  const [page, setPage] = useState("dashboard"),
    [period, setPeriod] = useState("7"),
    [query, setQuery] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [dark, setDark] = useState(
      () => localStorage.getItem("staff-dark") === "true",
    ),
    [dialog, setDialog] = useState(null),
    [bookingTab, setBookingTab] = useState("all");
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setMobile(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const searchRef = useRef(null),
    resource = useResource(`/staff/dashboard?days=${period}`),
    data = resource.data;
  const allowed =
    user.role === "Admin"
      ? Object.keys(pages)
      : user.role === "Receptionist"
        ? [
            "dashboard",
            "bookings",
            "rooms",
            "customers",
            "tasks",
            "employees",
            "shifts",
          ]
        : ["dashboard", "payments", "bookings", "reports"];
  function navigate(id) {
    if (!allowed.includes(id)) return;
    setPage(id);
    setMobile(false);
    setDialog(null);
    if (id === "dashboard" || id === "reports") resource.reload();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  function select(label) {
    if (label === "อัตราการเข้าพัก" || label === "ADR / RevPAR") {
      setDialog({ metric: true });
      return;
    }
    navigate(
      ["ห้องว่าง", "ว่าง", "มีผู้พัก", "รอทำความสะอาด", "ซ่อมบำรุง"].includes(label)
        ? "rooms"
        : "bookings",
    );
  }
  function exportCsv() {
    if (!data) return;
    const rows = [
      ["วันที่", "รายรับ", "ช่วงก่อนหน้า"],
      ...data.revenue.series.map((p) => [p.date, p.value, p.prev]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + rows.map((r) => r.join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `ruenrom-revenue-${data.from}-${data.asOf}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const overview = ["dashboard", "reports"].includes(page);
  return (
    <div
      className={`sd-app ${collapsed ? "is-collapsed" : ""} ${dark ? "is-dark" : ""}`}
    >
      <Sidebar
        activeLabel={pages[page]}
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobile={mobile}
        setMobile={setMobile}
        onSelect={(label) =>
          navigate(Object.keys(pages).find((k) => pages[k] === label))
        }
      />
      <div className="sd-workspace">
        <Topbar
          dashboard={overview}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          period={period}
          setPeriod={setPeriod}
          dark={dark}
          setDark={(value) => {
            setDark(value);
            localStorage.setItem("staff-dark", String(value));
          }}
          setMobile={setMobile}
          onProfile={() => setDialog({ profile: true })}
        />
        <div className="sd-content">
          <div className="sd-page-title">
            <div>
              <div className="sd-breadcrumb">RUENROM / STAFF WORKSPACE</div>
              <h1>{pages[page]}</h1>
            </div>
            {overview && data?.financial && (
              <button className="sd-primary" onClick={exportCsv}>
                <Download />
                ส่งออก CSV
              </button>
            )}
          </div>
          {!overview ? (
            <section
              className="sd-card bo-management sd-management"
              aria-label={pages[page]}
            >
              {page === "rooms" ? (
                <Rooms user={user} />
              ) : page === "bookings" ? (
                <Bookings user={user} />
              ) : page === "payments" ? (
                <Payments run={run} />
              ) : ["promotions", "packages", "users"].includes(page) ? (
                <Management key={page} tab={page} run={run} />
              ) : (
                <Operations key={page} page={page} user={user} />
              )}
            </section>
          ) : resource.loading ? (
            <DashboardSkeleton />
          ) : resource.error ? (
            <div role="alert" className="sd-card">
              <p>{resource.error}</p>
              <button onClick={resource.reload}>ลองอีกครั้ง</button>
            </div>
          ) : (
            <>
              <div className="sd-demo">
                <span>
                  ข้อมูลจริง ณ {data.asOf} · {period} วันล่าสุด
                </span>
                <button onClick={resource.reload}>อัปเดตข้อมูล</button>
              </div>
              <div className="sd-kpis">
                {[
                  [DoorOpen, "ห้องว่าง", data.rooms.available],
                  [BedDouble, "ห้องมีผู้พัก", data.rooms.occupied],
                  [LogIn, "เช็กอินวันนี้", data.today.checkIns],
                  [LogOut, "เช็กเอาต์วันนี้", data.today.checkOuts],
                ].map(([icon, label, value]) => (
                  <KpiCard
                    key={label}
                    icon={icon}
                    label={label}
                    value={value}
                    delta={null}
                    onClick={() => select(label)}
                  />
                ))}
              </div>
              <div className="sd-main-grid">
                <div className="sd-main-column">
                  {data.financial && (
                    <RevenueChart data={data} onDetail={select} />
                  )}
                  <RoomStatusStrip rooms={data.rooms} onSelect={select} />
                  <p className="sd-side-note">
                    การจองใหม่ {data.bookings.count} รายการ · ยกเลิก{" "}
                    {data.bookings.cancelled} รายการ
                  </p>
                </div>
                <div className="sd-side-column">
                  <WeekdayBars values={data.bookings.byWeekday} />
                  <OccupancyGauge
                    kpi={data.kpi}
                    onClick={() => setDialog({ metric: true })}
                  />
                </div>
              </div>
              <div className="sd-full-table">
                <BookingsTable
                  rows={data.recent}
                  asOf={data.asOf}
                  query={query}
                  tab={bookingTab}
                  setTab={setBookingTab}
                  onView={(booking) => setDialog({ booking })}
                />
              </div>
              <p className="sd-side-note">{data.notes}</p>
            </>
          )}
          <footer className="sd-footer">
            RUENROM HOTEL<span>STAFF WORKSPACE</span>
          </footer>
        </div>
      </div>
      {dialog && (
        <Dialog
          title={
            dialog.profile
              ? "บัญชีพนักงาน"
              : dialog.metric
                ? "รายละเอียดตัวชี้วัด"
                : "รายละเอียดการจอง"
          }
          onClose={() => setDialog(null)}
        >
          {dialog.profile ? (
            <div className="rm-form">
              <p>
                {user.name} · {user.role}
              </p>
              <button
                onClick={() =>
                  run(async () => {
                    await api("/auth/logout", {});
                    location.assign("/login");
                  })
                }
              >
                ออกจากระบบ
              </button>
            </div>
          ) : dialog.booking ? (
            <BookingDetails id={dialog.booking.id} />
          ) : (
            <p>{data?.notes}</p>
          )}
        </Dialog>
      )}
    </div>
  );
}
