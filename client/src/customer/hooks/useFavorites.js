import { useEffect, useState } from "react";
import { FAVORITES_KEY, parseFavorites } from "../lib/favorites.js";
const CHANGED = "ruenrom:favorites";
const read = () => {
  try {
    return parseFavorites(localStorage.getItem(FAVORITES_KEY));
  } catch {
    return [];
  }
};
export const favoriteKey = (room) => room.type.toLowerCase();
export function useFavorites() {
  const [saved, setSaved] = useState(read);
  useEffect(() => {
    const sync = (event) => {
      if (event.type === CHANGED) setSaved(event.detail);
      else if (!event.key || event.key === FAVORITES_KEY) setSaved(read());
    };
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGED, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGED, sync);
    };
  }, []);
  const toggle = (key) => {
    const next = saved.includes(key)
      ? saved.filter((k) => k !== key)
      : [...saved, key];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      /* Device storage may be disabled; keep this visit working. */
    }
    setSaved(next);
    window.dispatchEvent(new CustomEvent(CHANGED, { detail: next }));
  };
  return [saved, toggle];
}
