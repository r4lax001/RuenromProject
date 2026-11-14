export const FAVORITES_KEY = "ruenrom-favorites";
const TYPES = ["classic", "deluxe", "suite", "penthouse"];
export function parseFavorites(raw) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value)
      ? [...new Set(value.filter((key) => TYPES.includes(key)))]
      : [];
  } catch {
    return [];
  }
}
