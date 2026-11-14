import { useEffect, useState } from "react";
import { api } from "../lib/api";
export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [revision, reload] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setState({ data: null, loading: true, error: "" });
    api(path, undefined, "GET", c.signal)
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({ data: null, loading: false, error: e.message });
      });
    return () => c.abort();
  }, [path, revision]);
  return { ...state, reload: () => reload((n) => n + 1) };
}
