import React from "react";
import { formatDateLong } from "../utils.js";
import { isImageSticker, resolveSticker, stickerLabel } from "../utils.js";

const h = React.createElement;

export default function EntryReader({ entry, themeId, onBack, onEdit, onDelete }) {
  const sticker = resolveSticker(entry.sticker, themeId);

  return h('div', { className: "panel" },
    h('div', { className: "panel-hdr" },
      h('button', { className: "back-btn", onClick: onBack }, "← Back"),
      h('span', { className: "panel-title" }, "Entry")
    ),
    h('div', { className: "read-layout" },
      h('div', { className: "read-entry-box" },
        h('div', { className: "read-meta-box" },
          h('div', { className: "read-date" }, formatDateLong(entry.date)),
          entry.title && h('div', { className: "read-title" }, entry.title)
        ),
        h('div', { className: "read-sticker-box" },
          sticker
            ? (isImageSticker(sticker)
              ? h('img', { className: "read-sticker-image", src: sticker, alt: stickerLabel(entry.sticker) })
              : h('div', { className: "read-sticker" }, sticker))
            : h('div', { className: "read-sticker-placeholder", 'aria-hidden': true }, "")
        ),
        h('div', { className: "read-body" }, entry.body)
      )
    ),
    h('div', { className: "action-row" },
      h('button', { className: "edit-btn", onClick: onEdit }, "✏️ Edit Entry"),
      h('button', { className: "del-btn", onClick: onDelete }, "🗑️ Delete")
    ),
    h('div', { style: { height: 32 } })
  );
}
