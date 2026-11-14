import { useEffect } from "react";

export default function ClickSparkles() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sparkle(event) {
      if (window.location.pathname === "/") return;
      if (event.button !== 0 || event.detail === 0 || reduced.matches) return;
      const burst = document.createElement("span");
      burst.className = "rr-click-sparkles";
      burst.setAttribute("aria-hidden", "true");
      burst.style.left = event.clientX + "px";
      burst.style.top = event.clientY + "px";
      const parent = event.target.closest?.("dialog[open]") || document.body;
      for (let i = 0; i < 6; i++) {
        const star = document.createElement("i");
        const angle = (i + Math.random() * .45) * Math.PI / 3;
        const radius = 20 + Math.random() * 12;
        star.style.setProperty("--dx", Math.cos(angle) * radius + "px");
        star.style.setProperty("--dy", Math.sin(angle) * radius + "px");
        burst.append(star);
      }
      parent.append(burst);
      window.setTimeout(() => burst.remove(), 580);
    }
    document.addEventListener("click", sparkle, true);
    return () => document.removeEventListener("click", sparkle, true);
  }, []);
  return null;
}
