import { useEffect, useState } from "react";
import { filtersFromQuery } from "../lib/stay.js";
export function useRoute() {
  const read = () => ({
    path: location.pathname,
    query: new URLSearchParams(location.search),
  });
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const fn = () => setRoute(read());
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  return [
    route,
    (path, params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "",
        ),
      );
      history.pushState({}, "", path + (q.size ? "?" + q : ""));
      setRoute(read());
      window.scrollTo(0, 0);
    },
  ];
}
export const getFilters = filtersFromQuery;
