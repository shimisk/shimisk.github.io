import React, { useEffect, useRef } from "react";
import { STICKER_CATEGORIES } from "../themes.js";
import { isImageSticker, resolveSticker, stickerKey, stickerLabel } from "../utils.js";

const h = React.createElement;

export default function StickerPicker({ selected, themeId, onChange, onClose }) {
  const sheetRef = useRef();
  const stickers = STICKER_CATEGORIES[themeId]?.stickers || STICKER_CATEGORIES.witchy?.stickers || [];
  const selectedSticker = resolveSticker(selected[0], themeId);

  useEffect(() => {
    const handler = e => { if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const pick = sticker => {
    onChange(selected[0] === sticker ? [] : [sticker]);
    onClose();
  };

  return h('div', { className: "picker-overlay" },
    h('div', { className: "picker-sheet", ref: sheetRef },
      h('div', { className: "picker-handle" }, h('div', { className: "picker-handle-bar" })),
      h('div', { className: "picker-top" },
        h('span', { className: "picker-label" }, "Pick your mood"),
        h('button', { className: "picker-close", onClick: onClose }, "✕")
      ),
      selected.length > 0 && h('div', { className: "picker-preview" },
        isImageSticker(selectedSticker)
          ? h('img', { className: "picker-preview-image", src: selectedSticker, alt: stickerLabel(selected[0]) })
          : h('span', { style: { fontSize: "1.8em" } }, selected[0]),
        h('div', null,
          h('div', { className: "picker-preview-name" }, stickerLabel(selected[0])),
          h('span', { className: "picker-preview-hint" }, "tap again to remove")
        )
      ),
      h('div', { className: "picker-grid" },
        stickers.map((sticker, i) => {
          const key = stickerKey(sticker);

          return h('button', { key: i, className: `picker-emoji${selected[0] === key ? " selected" : ""}`, onClick: () => pick(key) },
            isImageSticker(sticker)
              ? h('img', { className: "picker-emoji-image", src: sticker, alt: stickerLabel(key) })
              : sticker,
            h('div', { className: "picker-emoji-label" }, stickerLabel(key))
          )
        })
      )
    )
  );
}
