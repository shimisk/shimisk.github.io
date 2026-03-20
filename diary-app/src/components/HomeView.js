import React from "react";
import EntryCard from "./EntryCard.js";

const h = React.createElement;

export default function HomeView({ entries, themeId, themeStar, onOpenEntry, onNewEntry, onSettings }) {
  return h(React.Fragment, null,
    h('div', { className: "hdr" },
      h('span', { className: "hdr-title" }, `${themeStar} My Diary`),
      h('div', { className: "hdr-actions" },
        h('a', { className: "store-link-btn", href: "https://shimisk.github.io/", target: "_blank", rel: "noopener noreferrer" }, "Store"),
        h('button', { className: "icon-btn", onClick: onSettings }, "⚙️")
      )
    ),
    h('div', { className: "cards" },
      entries.length === 0 ? 
        h('div', { className: "empty" },
          h('span', { className: "empty-icon" }, "📖"),
          h('p', { style: { lineHeight: 1.7 } }, "Your diary is empty.", h('br'), "Tap + to write your first entry.")
        )
      :
        entries.map((entry, index) =>
          h(EntryCard, {
            key: entry.id || `${entry.date}-${entry.updatedAt || 0}`,
            entry,
            themeId,
            cardIndex: index,
            onClick: () => onOpenEntry(entry)
          })
        )
    ),
    h('button', { className: "fab", onClick: onNewEntry }, "+")
  );
}
