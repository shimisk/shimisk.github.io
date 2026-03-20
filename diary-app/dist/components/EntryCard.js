import React from "react";
import { THEMES } from "../themes.js";
import { isImageSticker, stickerLabel } from "../utils.js";
const h = React.createElement;
export default function EntryCard({
  entry,
  themeId,
  cardIndex,
  onClick
}) {
  const theme = THEMES[themeId] || THEMES.witchy;
  const totalCards = theme.assets?.cards?.length || theme.fallback?.cards?.length || 1;
  const idx = ((cardIndex ?? 0) % totalCards + totalCards) % totalCards;
  const [y, m, d] = entry.date.split("-").map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const dayNumber = String(d || dateObj.getDate()).padStart(2, "0");
  const dayShort = dateObj.toLocaleDateString(undefined, {
    weekday: "short"
  });
  return h('div', {
    className: "card",
    style: {
      backgroundColor: theme.fallback.cards[idx],
      backgroundImage: `url("${theme.assets.cards[idx]}")`
    },
    onClick: onClick
  }, h('div', {
    className: "card-main"
  }, h('div', {
    className: "card-date-block"
  }, h('div', {
    className: "card-day-number"
  }, dayNumber), h('div', {
    className: "card-day-label"
  }, dayShort)), h('div', {
    className: "card-sticker-col"
  }, entry.sticker ? isImageSticker(entry.sticker) ? h('img', {
    className: "card-sticker-image",
    src: entry.sticker,
    alt: stickerLabel(entry.sticker)
  }) : h('div', {
    className: "card-sticker"
  }, entry.sticker) : h('div', {
    className: "card-sticker-placeholder",
    'aria-hidden': true
  }, "")), h('div', {
    className: "card-text"
  }, entry.title && h('div', {
    className: "card-title"
  }, entry.title), h('div', {
    className: "card-snippet"
  }, entry.body))));
}