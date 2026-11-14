import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import LoadingImage from "../LoadingImage";

export default function PlaceStory({ places, onSelect }) {
  const [active, setActive] = useState(0);
  const steps = useRef(null);
  useEffect(() => {
    let frame;
    function update() {
      frame = 0;
      const distances = Array.from(steps.current.children, el => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.top + r.height / 2 - innerHeight / 2);
      });
      setActive(distances.indexOf(Math.min(...distances)));
    }
    function queue() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue); };
  }, []);
  return <div className="rr-story">
    <div className="rr-story-photo" aria-hidden="true">{places.map((p,i) =>
      <LoadingImage key={p.name} src={p.image} alt="" loading="lazy" className={i === active ? "current" : ""} />)}</div>
    <div ref={steps} className="rr-story-steps">{places.map((p,i) =>
      <button type="button" key={p.name} className={active === i ? "current" : ""} onClick={() => onSelect(p)} aria-haspopup="dialog">
        <strong>{p.name}</strong><span>{p.thai} <ArrowRight /></span><small>{p.description}</small>
      </button>)}</div>
  </div>;
}
