import { Words } from "../../components/ScrollEffects";
import React from "react";
import { AlertCircle, Search } from "lucide-react";
export function Heading({ label, title, children }) {
  return (
    <div className="cx-heading">
      <span className="rr-kicker">{label}</span>
      <h1><Words>{title}</Words></h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Empty({
  title = "ยังไม่มีรายการ",
  children,
  icon: Icon = Search,
}) {
  return (
    <div className="cx-empty">
      <Icon />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return message ? (
    <div className="cx-error" role="alert">
      <AlertCircle />
      <span>{message}</span>
      {retry && (
        <button type="button" onClick={retry}>
          ลองใหม่
        </button>
      )}
    </div>
  ) : null;
}
export function Loading({ layout = "cards", label = "กำลังโหลดข้อมูล" }) {
  return (
    <div className={`cx-skeletons cx-loading-${layout}`} role="status" aria-label={label}>
      {[1, 2, 3].map(n => (
        <div className="cx-loading-item" key={n} aria-hidden="true">
          {layout === "cards" && <span className="cx-loading-photo" />}
          <span className="cx-loading-line" />
          <span className="cx-loading-line" />
        </div>
      ))}
    </div>
  );
}
