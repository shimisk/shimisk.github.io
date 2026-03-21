import { STICKER_CATEGORIES } from "./themes.js";

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateLong(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function formatDateShort(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatMonthYear(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

export function isImageSticker(sticker) {
  return typeof sticker === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(sticker);
}

export function stickerKey(sticker) {
  if (typeof sticker !== "string" || !sticker) return "";
  if (isImageSticker(sticker)) {
    return sticker.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
  }
  return sticker;
}

export function resolveSticker(sticker, themeId = "witchy") {
  if (typeof sticker !== "string" || !sticker) return "";
  if (!isImageSticker(sticker) && !/^[a-z0-9-]+$/i.test(sticker)) return sticker;

  const key = stickerKey(sticker);
  const stickers = STICKER_CATEGORIES[themeId]?.stickers || STICKER_CATEGORIES.witchy?.stickers || [];
  const match = stickers.find(item => stickerKey(item) === key);
  return match || sticker;
}

export function stickerLabel(sticker) {
  return stickerKey(sticker)
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
