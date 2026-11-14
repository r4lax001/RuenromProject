export async function api(path, body, method = "POST", signal) {
  const response = await fetch("/api" + path, {
    credentials: "same-origin",
    signal,
    ...(body !== undefined
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("ระบบยังไม่พร้อมให้บริการ กรุณาลองใหม่อีกครั้ง");
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith("/auth/") &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event("ruenrom:session-expired"));
    }
    throw new Error(data?.message || "ไม่สามารถทำรายการได้");
  }
  return data;
}
