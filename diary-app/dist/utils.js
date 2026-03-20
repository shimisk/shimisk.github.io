export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
export function formatDateLong(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
export function formatDateShort(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
export function isImageSticker(sticker) {
  return typeof sticker === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(sticker);
}
export function stickerLabel(sticker) {
  if (typeof sticker !== "string" || !sticker) return "";
  const fileName = sticker.split("/").pop()?.replace(/\.[^.]+$/, "") || sticker;
  return fileName.split("-").filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

// Stable 0-4 slot from date string — same entry always gets same card background
export function cardBgIndex(dateStr) {
  return dateStr.replace(/-/g, "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5;
}
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "diary_salt_v1"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}