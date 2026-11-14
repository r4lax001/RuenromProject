import React, { useEffect, useState } from "react";
import { CalendarDays, Search, Users } from "lucide-react";
import { day } from "../lib/format";
import { isDate, nextDate, stayError } from "../lib/stay.js";
import { ErrorBox } from "./Feedback";
export function SearchForm({ filters, onSearch }) {
  const [draft, setDraft] = useState(filters);
  useEffect(
    () => setDraft(filters),
    [filters.checkIn, filters.checkOut, filters.guests, filters.type],
  );
  const [error, setError] = useState("");
  return (
    <>
      <form
        className="cx-search"
        onSubmit={(e) => {
          e.preventDefault();
          const message = stayError(draft);
          if (message) {
            setError(message);
            return;
          }
          setError("");
          onSearch(draft);
        }}
      >
        <label>
          <span>
            <CalendarDays />
            เช็กอิน
          </span>
          <input
            required
            type="date"
            min={day()}
            value={draft.checkIn}
            onChange={(e) => setDraft({ ...draft, checkIn: e.target.value })}
          />
        </label>
        <label>
          <span>
            <CalendarDays />
            เช็กเอาต์
          </span>
          <input
            required
            type="date"
            min={isDate(draft.checkIn) ? nextDate(draft.checkIn) : day(1)}
            value={draft.checkOut}
            onChange={(e) => setDraft({ ...draft, checkOut: e.target.value })}
          />
        </label>
        <label>
          <span>
            <Users />
            ผู้เข้าพัก
          </span>
          <select
            value={draft.guests}
            onChange={(e) =>
              setDraft({ ...draft, guests: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} คน
              </option>
            ))}
          </select>
        </label>
        <button className="rr-button">
          <Search />
          ค้นหาห้องว่าง
        </button>
      </form>
      <ErrorBox message={error} />
    </>
  );
}
