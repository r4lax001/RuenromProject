import { useEffect, useRef, useState } from "react";
import "./scrollEffects.css";

const segmenter = typeof Intl.Segmenter === "function" && new Intl.Segmenter("th", { granularity: "word" });
export function Words({ children }) {
  if (typeof children !== "string") return children;
  const parts = segmenter ? Array.from(segmenter.segment(children), s => s.segment) : children.split(/(\s+)/);
  return parts.map((part, i) => part.trim() ? <span key={i} className="rr-split-word" style={{ "--word-delay": Math.min(i, 12) * 45 + "ms" }}>{part}</span> : part);
}

export function CountUp({ value }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    function finish() { cancelAnimationFrame(frame); setShown(value); }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      if (preference.matches) return finish();
      const start = performance.now();
      function tick(time) {
        const t = Math.min(1, (time - start) / 750);
        setShown(Math.round(value * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      }
      tick(start);
    });
    observer.observe(ref.current);
    preference.addEventListener("change", finish);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); preference.removeEventListener("change", finish); };
  }, [value]);
  return <span ref={ref}><span aria-hidden="true">{shown}</span><span className="cx-sr">{value}</span></span>;
}

export default function ScrollEffects() {
  useEffect(() => {
    const selector = ".cx-heading,.cx-panel,.cx-section,.cx-room,.cx-booking-card,.cx-auth-form,.sd-card,.sd-page-title,.rm-card";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("rr-in-view");
        observer.unobserve(entry.target);
      }
    });
    function observe(node) {
      if (!(node instanceof Element)) return;
      if (node.matches(selector)) observer.observe(node);
      node.querySelectorAll(selector).forEach(el => observer.observe(el));
    }
    const root = document.getElementById("root");
    observe(root);
    const changes = new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(observe)));
    changes.observe(root, { subtree: true, childList: true });
    return () => { changes.disconnect(); observer.disconnect(); };
  }, []);
  return null;
}
