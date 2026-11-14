import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Heart,
  House,
  LayoutDashboard,
  MapPin,
  Menu,
  X,
  UserRound,
  LogOut,
} from "lucide-react";

export function HomeHeader({ user, go, logout, home = false, page = "home" }) {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef(null);
  useEffect(() => setMenu(false), [page]);
  useEffect(() => {
    if (!menu) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  const navigate = (page) => {
    setMenu(false);
    go(page);
  };
  return (
    <header className="rr-header">
      <a
        className="rr-logo"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate("home");
        }}
      >
        <span>
          RUENROM<span className="rr-logo-dot">.</span>
        </span>
        <small>BOUTIQUE HOTEL · BANGKOK</small>
      </a>
      <nav
        id="main-navigation"
        className={`rr-nav ${menu ? "is-open" : ""}`}
        aria-label="เมนูหลัก"
      >
        <button
          className={home ? "is-current" : ""}
          aria-current={home ? "page" : undefined}
          onClick={() => navigate("home")}
        >
          <House aria-hidden="true" />
          <span>หน้าแรก</span>
        </button>
        <button
          className={
            ["rooms", "room", "checkout"].includes(page) ? "is-current" : ""
          }
          onClick={() => navigate("rooms")}
          aria-current={
            ["rooms", "room", "checkout"].includes(page) ? "page" : undefined
          }
        >
          <BedDouble aria-hidden="true" />
          <span>ห้องพัก</span>
        </button>
        {home && (
          <a href="#rr-neighborhood" onClick={() => setMenu(false)}>
            <MapPin aria-hidden="true" />
            <span>ค้นพบกรุงเทพฯ</span>
          </a>
        )}
        {user && (
          <button
            className={
              ["bookings", "booking", "payment", "confirmation"].includes(page)
                ? "is-current"
                : ""
            }
            onClick={() => navigate("bookings")}
            aria-current={
              ["bookings", "booking", "payment", "confirmation"].includes(page)
                ? "page"
                : undefined
            }
          >
            <CalendarDays aria-hidden="true" />
            <span>การจองของฉัน</span>
          </button>
        )}
        {user && user.role !== "Customer" && (
          <button
            className={page === "staff" ? "is-current" : ""}
            aria-current={page === "staff" ? "page" : undefined}
            onClick={() => navigate("staff")}
          >
            <LayoutDashboard aria-hidden="true" />
            <span>จัดการโรงแรม</span>
          </button>
        )}
        {user && (
          <button
            className="rr-mobile-logout"
            onClick={() => {
              setMenu(false);
              logout();
            }}
          >
            <LogOut aria-hidden="true" />
            ออกจากระบบ
          </button>
        )}
      </nav>
      <div className="rr-header-actions">
        <button
          className="rr-icon"
          aria-label="รายการโปรด"
          title="รายการโปรด"
          onClick={() => navigate("favorites")}
        >
          <Heart />
        </button>
        <button
          className="rr-account"
          aria-label={user ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}
          onClick={() => (user ? navigate("profile") : navigate("login"))}
        >
          <UserRound />
          <span>{user ? user.name : "เข้าสู่ระบบ"}</span>
        </button>
        {user && (
          <button
            className="rr-icon rr-desktop-logout"
            onClick={logout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
          >
            <LogOut />
          </button>
        )}
        <button
          className="rr-button rr-header-book"
          onClick={() => navigate("rooms")}
        >
          จองการพักผ่อน <ArrowUpRight />
        </button>
        <button
          className="rr-icon rr-menu"
          ref={menuButton}
          aria-label={menu ? "ปิดเมนู" : "เปิดเมนู"}
          aria-controls="main-navigation"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
