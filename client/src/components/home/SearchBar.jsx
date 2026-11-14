import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { isDate, stayError } from "../../customer/lib/stay.js";

const today = (offset = 0) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offset * 86400000));

import { Dialog } from "./Dialog";
export default function SearchBar({ onSearch }) {
  const [dates, setDates] = useState({ checkIn: today(), checkOut: today(1) });
  const [guests, setGuests] = useState(2);
  const [panel, setPanel] = useState(null);
  const validation = stayError({ ...dates, guests });
  const format = (d) =>
    !isDate(d)
      ? "เลือกวันที่"
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
        }).format(new Date(d + "T12:00:00"));
  return (
    <>
      <form
        className="rr-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (validation) {
            setPanel("dates");
            return;
          }
          onSearch({ ...dates, guests });
        }}
      >
        <div className="rr-search-field rr-destination">
          <MapPin />
          <div>
            <span className="rr-field-label">YOUR DESTINATION</span>
            <strong>Bangkok, Thailand</strong>
          </div>
        </div>
        <button
          type="button"
          className="rr-search-field"
          onClick={() => setPanel("dates")}
        >
          <CalendarDays />
          <div>
            <span className="rr-field-label">CHECK-IN — CHECK-OUT</span>
            <strong>
              {format(dates.checkIn)} — {format(dates.checkOut)}
            </strong>
          </div>
          <ChevronDown className="rr-chevron" />
        </button>
        <button
          type="button"
          className="rr-search-field"
          onClick={() => setPanel("guests")}
        >
          <Users />
          <div>
            <span className="rr-field-label">GUESTS</span>
            <strong>{guests} ผู้เข้าพัก · 1 ห้อง</strong>
          </div>
          <ChevronDown className="rr-chevron" />
        </button>
        <button className="rr-button rr-search-submit">
          <Search />
          ค้นหาห้องพัก
        </button>
      </form>
      {panel === "dates" && (
        <Dialog title="เลือกวันพักผ่อน" onClose={() => setPanel(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!validation) setPanel(null);
            }}
          >
            <div className="rr-date-fields">
              <label>
                เช็กอิน
                <input
                  required
                  type="date"
                  min={today()}
                  value={dates.checkIn}
                  onChange={(e) => {
                    const checkIn = e.target.value;
                    if (checkIn)
                      setDates({
                        checkIn,
                        checkOut:
                          dates.checkOut > checkIn
                            ? dates.checkOut
                            : new Date(Date.parse(checkIn) + 86400000)
                                .toISOString()
                                .slice(0, 10),
                      });
                  }}
                />
              </label>
              <label>
                เช็กเอาต์
                <input
                  required
                  type="date"
                  min={new Date(Date.parse(dates.checkIn) + 86400000)
                    .toISOString()
                    .slice(0, 10)}
                  value={dates.checkOut}
                  onChange={(e) =>
                    setDates({ ...dates, checkOut: e.target.value })
                  }
                />
              </label>
            </div>
            <p role={validation ? "alert" : undefined}>
              {validation || "เลือกช่วงเข้าพัก 1–365 คืน"}
            </p>
            <button className="rr-button cx-confirm" disabled={!!validation}>
              <Check />
              ยืนยันวันเข้าพัก
            </button>
          </form>
        </Dialog>
      )}
      {panel === "guests" && (
        <Dialog title="พักผ่อนด้วยกันกี่คน?" onClose={() => setPanel(null)}>
          <div className="rr-counter">
            <div>
              <strong>ผู้เข้าพัก</strong>
              <p>สูงสุด 4 คนต่อห้อง</p>
            </div>
            <button
              className="rr-icon"
              disabled={guests === 1}
              onClick={() => setGuests(guests - 1)}
              aria-label="ลดจำนวนผู้เข้าพัก"
            >
              <Minus />
            </button>
            <strong aria-live="polite">{guests}</strong>
            <button
              className="rr-icon"
              disabled={guests === 4}
              onClick={() => setGuests(guests + 1)}
              aria-label="เพิ่มจำนวนผู้เข้าพัก"
            >
              <Plus />
            </button>
          </div>
          <button
            className="rr-button cx-confirm"
            onClick={() => setPanel(null)}
          >
            <Check />
            ยืนยัน
          </button>
        </Dialog>
      )}
    </>
  );
}
