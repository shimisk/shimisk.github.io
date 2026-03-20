import React, { useState } from "react";
import StickerPicker from "./StickerPicker.js";
import { todayStr, formatDateLong } from "../utils.js";
import { isImageSticker, stickerLabel } from "../utils.js";

const h = React.createElement;

function makeEntryId(seed = "entry") {
  return `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function EntryEditor({ initial, onSave, onBack }) {
  const [date,       setDate]       = useState(initial?.date    || todayStr());
  const [title,      setTitle]      = useState(initial?.title   || "");
  const [body,       setBody]       = useState(initial?.body    || "");
  const [sticker,    setSticker]    = useState(initial?.sticker ? [initial.sticker] : []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSave = () => {
    if (!body.trim()) return;
    onSave({
      id: initial?.id || makeEntryId(date),
      date,
      title: title.trim(),
      body: body.trim(),
      sticker: sticker[0] || null,
      updatedAt: Date.now()
    });
  };

  return h('div', { className: "panel" },
    h('div', { className: "panel-hdr" },
      h('button', { className: "back-btn", onClick: onBack }, "← Back"),
      h('span', { className: "panel-title" }, initial ? "Edit Entry" : "New Entry")
    ),
    h('div', { className: "editor-body" },
      h('div', { className: "editor-meta-box" },
        h('div', { className: "editor-date-row" },
          h('label', { className: "editor-date-btn" },
            h('span', null, "📅"),
            h('span', null, formatDateLong(date)),
            h('input', {
              type: "date",
              value: date,
              onChange: e => setDate(e.target.value),
              className: "date-input-overlay",
              "aria-label": "Choose entry date"
            })
          ),
        ),
        h('input', {
          type: "text",
          className: "editor-title-input",
          placeholder: "Title (optional)...",
          value: title,
          onChange: e => setTitle(e.target.value)
        })
      ),
      h('div', { className: "editor-sticker-box" },
        h('div', { className: "sticker-stage", onClick: () => setPickerOpen(true) },
          sticker.length > 0
            ? (isImageSticker(sticker[0])
              ? h('img', { className: "sticker-big-image", src: sticker[0], alt: stickerLabel(sticker[0]) })
              : h('div', { className: "sticker-big" }, sticker[0]))
            : h('div', { className: "sticker-add-ring" }, "＋")
        )
      ),
      h('div', { className: "editor-write-box" },
        h('textarea', {
          className: "editor-textarea",
          placeholder: "Write your thoughts for today...",
          value: body,
          onChange: e => setBody(e.target.value),
          autoFocus: !initial
        })
      )
    ),
    h('div', { className: "save-bar" },
      h('button', { className: "save-btn", onClick: handleSave, disabled: !body.trim() }, "✨ Save Entry")
    ),
    pickerOpen && h(StickerPicker, { selected: sticker, onChange: setSticker, onClose: () => setPickerOpen(false) })
  );
}
