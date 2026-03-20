import React, { useEffect, useRef } from "react";
import { STICKER_CATEGORIES } from "../themes.js";
import { isImageSticker, stickerLabel } from "../utils.js";
const h = React.createElement;
export default function StickerPicker({
  selected,
  onChange,
  onClose
}) {
  const sheetRef = useRef();
  const stickers = Object.values(STICKER_CATEGORIES)[0]?.stickers || [];
  useEffect(() => {
    const handler = e => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  const pick = emoji => {
    onChange(selected[0] === emoji ? [] : [emoji]);
    onClose();
  };
  return h('div', {
    className: "picker-overlay"
  }, h('div', {
    className: "picker-sheet",
    ref: sheetRef
  }, h('div', {
    className: "picker-handle"
  }, h('div', {
    className: "picker-handle-bar"
  })), h('div', {
    className: "picker-top"
  }, h('span', {
    className: "picker-label"
  }, "Pick your mood"), h('button', {
    className: "picker-close",
    onClick: onClose
  }, "✕")), selected.length > 0 && h('div', {
    className: "picker-preview"
  }, isImageSticker(selected[0]) ? h('img', {
    className: "picker-preview-image",
    src: selected[0],
    alt: stickerLabel(selected[0])
  }) : h('span', {
    style: {
      fontSize: "1.8em"
    }
  }, selected[0]), h('div', null, h('div', {
    className: "picker-preview-name"
  }, stickerLabel(selected[0])), h('span', {
    className: "picker-preview-hint"
  }, "tap again to remove"))), h('div', {
    className: "picker-grid"
  }, stickers.map((sticker, i) => h('button', {
    key: i,
    className: `picker-emoji${selected[0] === sticker ? " selected" : ""}`,
    onClick: () => pick(sticker)
  }, isImageSticker(sticker) ? h('img', {
    className: "picker-emoji-image",
    src: sticker,
    alt: stickerLabel(sticker)
  }) : sticker, h('div', {
    className: "picker-emoji-label"
  }, stickerLabel(sticker)))))));
}