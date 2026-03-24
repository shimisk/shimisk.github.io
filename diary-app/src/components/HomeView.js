import React from "react";
import EntryCard from "./EntryCard.js";
import { formatMonthYear } from "../utils.js";

const h = React.createElement;

function monthKey(date) {
  if (typeof date !== "string") return "";
  return date.slice(0, 7);
}

export default function HomeView({ entries, themeId, themeStar, onOpenEntry, onNewEntry, onSettings }) {
  return h(React.Fragment, null,
    h('div', { className: "hdr" },
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
        entries.flatMap((entry, index) => {
          const showMonthBanner = index === 0 || monthKey(entries[index - 1]?.date) !== monthKey(entry.date);
          const items = [];

          if (showMonthBanner) {
            items.push(
              h('div', {
                key: `month-${monthKey(entry.date)}`,
                className: "month-banner"
              },
                h('span', { className: "month-banner-label" }, formatMonthYear(entry.date))
              )
            );
          }

          items.push(
            h(EntryCard, {
              key: entry.id || `${entry.date}-${entry.updatedAt || 0}`,
              entry,
              themeId,
              cardIndex: index,
              onClick: () => onOpenEntry(entry)
            })
          );

          return items;
        })
    ),
    h('button', { className: "fab", onClick: onNewEntry }, "+")
  );
}
