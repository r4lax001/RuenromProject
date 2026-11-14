import React from "react";
export function Footer({ go }) {
  return (
    <footer className="cx-footer">
      <div>
        <span className="rr-logo">
          <span>RUENROM.</span>
          <small>BOUTIQUE HOTEL · BANGKOK</small>
        </span>
        <p>A little closer to feeling at home.</p>
      </div>
      <nav>
        <button onClick={() => go("/about")}>เกี่ยวกับโรงแรม</button>
        <button onClick={() => go("/policies")}>นโยบายการจอง</button>
        <button onClick={() => go("/favorites")}>รายการโปรด</button>
      </nav>
      <small>© {new Date().getFullYear()} RUENROM HOTEL</small>
    </footer>
  );
}
