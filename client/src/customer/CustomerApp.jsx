import React, { useEffect, useState } from "react";
import Home, { HomeHeader } from "../components/Home";
import {
  api,
  Empty,
  ErrorBox,
  Footer,
  getFilters,
  Loading,
  useRoute,
} from "./shared";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import AuthPage from "./pages/AuthPage";
import BookingsPage from "./pages/BookingsPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import InfoPage from "./pages/InfoPage";
import "./customer.css";
import "./buttons.css";
import "./motion.css";
import "./accessibility.css";

export default function CustomerApp({ renderStaff }) {
  const [route, go] = useRoute();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [error, setError] = useState("");
  const page = route.path.split("/")[1] || "home";
  const id = route.path.split("/")[2];
  const filters = getFilters(route.query);
  async function loadUser() {
    setAuthError("");
    setReady(false);
    try {
      setUser(await api("/auth/me"));
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    loadUser();
    const expire = () => setUser(null);
    window.addEventListener("ruenrom:session-expired", expire);
    return () => window.removeEventListener("ruenrom:session-expired", expire);
  }, []);
  useEffect(() => {
    setError("");
    document.title = `${{ home: "RUENROM HOTEL", rooms: "ห้องพัก", room: "รายละเอียดห้อง", checkout: "จองห้องพัก", bookings: "การจองของฉัน", favorites: "รายการโปรด", profile: "บัญชีของฉัน" }[page] || "RUENROM"} · Boutique Hotel`;
  }, [route.path]);
  const protectedPage = [
    "checkout",
    "bookings",
    "booking",
    "payment",
    "confirmation",
    "profile",
    "staff",
  ].includes(page);
  const current = route.path + location.search;
  const returnTo = route.query.get("returnTo");
  const safeReturn =
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.startsWith("/login") &&
    !returnTo.startsWith("/register") &&
    !returnTo.startsWith("/forgot-password")
      ? returnTo
      : null;
  function navigateReturn(path) {
    const url = new URL(path, location.origin);
    go(url.pathname, Object.fromEntries(url.searchParams));
  }
  async function run(fn) {
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e.message);
      return null;
    }
  }
  let content;
  if (protectedPage && !ready) content = <Loading />;
  else if (protectedPage && authError)
    content = <ErrorBox message={authError} retry={loadUser} />;
  else if (protectedPage && !user)
    content = (
      <AuthPage
        mode="login"
        go={go}
        returnTo={current}
        onLogin={(u) => {
          setAuthError("");
          setUser(u);
          navigateReturn(current);
        }}
      />
    );
  else if (page === "home")
    content = <Home user={user} onSearch={(f) => go("/rooms", f)} />;
  else if (page === "rooms" || page === "favorites")
    content = (
      <RoomsPage
        key={page}
        filters={filters}
        go={go}
        favorites={page === "favorites"}
      />
    );
  else if (page === "room")
    content = <RoomDetailPage id={id} filters={filters} go={go} />;
  else if (page === "checkout")
    content = (
      <CheckoutPage
        id={route.query.get("roomId")}
        filters={filters}
        user={user}
        go={go}
      />
    );
  else if (["login", "register", "forgot-password"].includes(page))
    content = (
      <AuthPage
        key={page}
        mode={page === "forgot-password" ? "forgot" : page}
        go={go}
        returnTo={safeReturn}
        onLogin={(u) => {
          setAuthError("");
          setUser(u);
          if (safeReturn) navigateReturn(safeReturn);
          else go(u.role === "Customer" ? "/bookings" : "/staff");
        }}
      />
    );
  else if (page === "bookings") content = <BookingsPage user={user} go={go} />;
  else if (["booking", "payment", "confirmation"].includes(page))
    content = (
      <BookingDetailPage
        key={page + id}
        user={user}
        mode={page}
        id={id}
        go={go}
      />
    );
  else if (["about", "policies", "profile"].includes(page))
    content = <InfoPage page={page} user={user} go={go} />;
  else if (page === "staff")
    content =
      user.role === "Customer" ? (
        <Empty title="หน้านี้สำหรับพนักงานเท่านั้น" />
      ) : (
        renderStaff(user, run)
      );
  else
    content = (
      <Empty title="ไม่พบหน้าที่คุณต้องการ">
        <button className="rr-button" onClick={() => go("/")}>
          กลับหน้าแรก
        </button>
      </Empty>
    );
  if (
    page === "staff" &&
    ready &&
    user &&
    user.role !== "Customer" &&
    !authError
  ) {
    return (
      <>
        <a className="cx-skip-link" href="#main-content">
          ข้ามไปยังเนื้อหา
        </a>
        <main id="main-content" className="bo-host" tabIndex={-1}>
          <ErrorBox message={error} />
          {content}
        </main>
      </>
    );
  }
  return (
    <>
      <a className="cx-skip-link" href="#main-content">
        ข้ามไปยังเนื้อหา
      </a>
      <HomeHeader
        user={user}
        page={page}
        home={page === "home"}
        go={(p) => go(p === "home" ? "/" : "/" + p)}
        logout={() =>
          run(async () => {
            await api("/auth/logout", {});
            setUser(null);
            go("/");
          })
        }
      />
      <div className="cx-app">
        <ErrorBox message={error} />
        {page === "home" ? (
          <main id="main-content" className="cx-home-main" tabIndex={-1}>
            {content}
          </main>
        ) : (
          <main id="main-content" className="cx-main" tabIndex={-1}>
            {content}
          </main>
        )}
        {page !== "home" && <Footer go={go} />}
      </div>
    </>
  );
}
