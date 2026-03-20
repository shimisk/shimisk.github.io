import React, { useRef, useState } from "react";
import { THEMES } from "../themes.js";
import { FONTS } from "../fonts.js";
import PinSetup from "./PinSetup.js";

const h = React.createElement;

export default function SettingsView({
  themeId, font, fontSize, lockEnabled,
  onChangeTheme, onChangeFont, onChangeFontSize,
  onLockEnabled, onLockDisabled,
  onRequestLockDisable,
  onExportBackup,
  onImportBackup,
  onDeleteAll, onBack,
}) {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const importInputRef = useRef(null);
  const currentFont = FONTS.find(f => f.id === font) || FONTS[2];

  const handleDeleteAll = async () => {
    onDeleteAll();
  };

  const handleDisableLock = async () => {
    onRequestLockDisable();
  };

  const handleImportFile = event => {
    const file = event.target.files?.[0];
    if (file) onImportBackup(file);
    event.target.value = "";
  };

  return h('div', { className: "panel settings-panel" },
    h('div', { className: "panel-hdr" },
      h('button', { className: "back-btn", onClick: onBack }, "← Back"),
      h('span', { className: "panel-title" }, "Settings")
    ),
    h('div', { className: "settings-s" },
      h('div', { className: "settings-st" }, "Theme"),
      h('div', { className: "theme-grid" },
        Object.entries(THEMES).map(([id, t]) =>
          h('button', { key: id, className: `theme-btn${themeId === id ? " on" : ""}`, onClick: () => onChangeTheme(id) },
            h('div', { style: { fontSize: "1.6em", marginBottom: 6 } }, t.icon),
            h('div', { style: { fontSize: ".8em", color: "var(--text2)" } }, t.label)
          )
        )
      )
    ),
    h('div', { className: "settings-s" },
      h('div', { className: "settings-st" }, "Font"),
      h('div', { className: "font-select-wrap" },
        h('select', { className: "font-select", value: font, onChange: e => onChangeFont(e.target.value), style: { fontFamily: currentFont.stack } },
          FONTS.map(f =>
            h('option', { key: f.id, value: f.id, style: { fontFamily: f.stack } }, f.name)
          )
        ),
        h('span', { className: "font-select-arrow" }, "▾")
      )
    ),
    h('div', { className: "settings-s" },
      h('div', { className:" settings-st" }, "Font Size"),
      h('div', { className: "size-row" },
        [["s","Small","13px"],["m","Medium","16px"],["l","Large","19px"]].map(([id, label, sz]) =>
          h('button', { key: id, className: `size-btn${fontSize === id ? " on" : ""}`, onClick: () => onChangeFontSize(id), style: { fontSize: sz } }, label)
        )
      )
    ),
    h('div', { className: "settings-s" },
      h('div', { className: "settings-st" }, "Security"),
      !lockEnabled ?
        h('button', { className: "generic-btn", onClick: () => setShowPinSetup(true) }, "🔒 Enable PIN lock")
      :
        h(React.Fragment, null,
          h('div', { className: "security-row" },
            h('span', { style: { color: "var(--text2)", fontSize: ".9em" } },
              "🔒 PIN lock is ",
              h('strong', { style: { color: "var(--accent3)" } }, "on")
            )
          ),
          h('button', { className: "generic-btn", onClick: () => setShowPinSetup(true) }, "🔑 Change PIN"),
          h('button', { className: "generic-btn danger", onClick: handleDisableLock }, "🔓 Disable lock")
        )
    ),
    h('div', { className: "settings-s" },
      h('div', { className: "settings-st" }, "Backup & Storage"),
      h('div', { className: "settings-note settings-warning" },
        h('strong', null, "Important:"),
        " This diary is stored in your browser on this device. If you clear browser or website data, your entries can be deleted. Export backups regularly."
      ),
      h('button', { className: "generic-btn", onClick: onExportBackup }, "📦 Export diary backup"),
      h('button', { className: "generic-btn", onClick: () => importInputRef.current?.click() }, "📥 Import diary backup"),
      h('input', {
        ref: importInputRef,
        className: "backup-file-input",
        type: "file",
        accept: "application/json,.json",
        onChange: handleImportFile,
      })
    ),
    h('div', { className: "danger-zone" },
      h('div', { className: "settings-st" }, "Danger Zone"),
      h('button', { className: "generic-btn danger", onClick: handleDeleteAll }, "🗑️ Delete entire diary")
    ),
    showPinSetup && h(PinSetup, {
      hasExisting: lockEnabled,
      onDone: () => { setShowPinSetup(false); onLockEnabled(); },
      onCancel: () => setShowPinSetup(false)
    })
  );
}
