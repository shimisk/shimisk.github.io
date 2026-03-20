import React, { useState, useEffect, useCallback } from "react";
import { THEMES } from "../themes.js";
import { FONTS, FONT_SIZES, loadAllFonts } from "../fonts.js";
import { applyTheme } from "../utils.js";
import { getAllEntries, saveEntry, deleteEntry, clearAllEntries, getSetting, setSetting, loadAllSettings } from "../db.js";
import HomeView from "./HomeView.js";
import EntryEditor from "./EntryEditor.js";
import EntryReader from "./EntryReader.js";
import SettingsView from "./SettingsView.js";
import LockScreen from "./LockScreen.js";
const h = React.createElement;
function sortEntries(list) {
  return [...list].sort((a, b) => {
    const byDate = (b.date || "").localeCompare(a.date || "");
    if (byDate !== 0) return byDate;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}
export default function App() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [themeId, setThemeId] = useState("witchy");
  const [font, setFont] = useState("playfair");
  const [fontSize, setFontSize] = useState("m");
  const [view, setView] = useState("home");
  const [activeEntry, setActiveEntry] = useState(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  // Boot: load DB data, apply saved settings
  useEffect(() => {
    async function boot() {
      try {
        const [allEntries, settings] = await Promise.all([getAllEntries(), loadAllSettings()]);
        setEntries(sortEntries(allEntries));
        if (settings.theme) setThemeId(settings.theme);
        if (settings.font) setFont(settings.font);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.lockEnabled) setLockEnabled(true);
      } catch (e) {
        console.error("Boot error:", e);
      }
      setLoaded(true);
    }
    boot();
    loadAllFonts();
  }, []);

  // Apply theme CSS vars to :root whenever theme changes
  useEffect(() => {
    const theme = THEMES[themeId] || THEMES.witchy;
    applyTheme(theme);
  }, [themeId]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2400);
    return () => clearTimeout(timer);
  }, [feedback]);
  const currentTheme = THEMES[themeId] || THEMES.witchy;
  const currentFont = FONTS.find(f => f.id === font) || FONTS[2];
  const normalizedFontSize = `calc(${FONT_SIZES[fontSize]} * ${currentFont.sizeScale || 1})`;
  const showFeedback = useCallback((message, type = "info") => {
    setFeedback({
      message,
      type,
      ts: Date.now()
    });
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(type === "error" ? [24, 60, 24] : 20);
    }
  }, []);
  const openConfirm = useCallback(({
    title,
    message,
    confirmLabel = "Delete",
    onConfirm
  }) => {
    setConfirmState({
      title,
      message,
      confirmLabel,
      onConfirm
    });
  }, []);
  const closeConfirm = useCallback(() => setConfirmState(null), []);
  const runConfirm = useCallback(async () => {
    if (!confirmState?.onConfirm) return;
    await confirmState.onConfirm();
    setConfirmState(null);
  }, [confirmState]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveEntry = useCallback(async entry => {
    const existingForDate = entries.find(e => e.date === entry.date && e.id !== entry.id);
    if (existingForDate) {
      showFeedback("You already have an entry for this date. Edit it or pick another date.", "error");
      return;
    }
    const id = await saveEntry(entry);
    const savedEntry = {
      ...entry,
      id: entry.id || id
    };
    setEntries(prev => sortEntries([savedEntry, ...prev.filter(e => e.id !== savedEntry.id)]));
    setView("home");
    showFeedback("Entry saved", "success");
  }, [entries, showFeedback]);
  const handleDeleteEntry = useCallback(async id => {
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setActiveEntry(prev => prev?.id === id ? null : prev);
    setView("home");
    showFeedback("Entry deleted", "success");
  }, [showFeedback]);
  const changeTheme = async id => {
    setThemeId(id);
    await setSetting("theme", id);
  };
  const changeFont = async id => {
    setFont(id);
    await setSetting("font", id);
  };
  const changeFontSize = async s => {
    setFontSize(s);
    await setSetting("fontSize", s);
  };
  const forgotPin = useCallback(() => {
    openConfirm({
      title: "Reset lock and delete diary?",
      message: "This will remove your PIN and permanently delete all diary entries.",
      confirmLabel: "Delete & Reset",
      onConfirm: async () => {
        await clearAllEntries();
        await setSetting("lockEnabled", false);
        await setSetting("pinHash", null);
        setEntries([]);
        setLockEnabled(false);
        setUnlocked(true);
        showFeedback("Diary cleared and lock removed", "success");
      }
    });
  }, [openConfirm, showFeedback]);
  const requestDisableLock = useCallback(() => {
    openConfirm({
      title: "Disable PIN lock?",
      message: "Your diary will open without a PIN until you enable it again.",
      confirmLabel: "Disable Lock",
      onConfirm: async () => {
        await setSetting("lockEnabled", false);
        await setSetting("pinHash", null);
        setLockEnabled(false);
        setUnlocked(true);
        showFeedback("PIN lock removed", "success");
      }
    });
  }, [openConfirm, showFeedback]);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (!loaded) {
    return h('div', {
      style: {
        background: "#0d0a1a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "3rem"
      }
    }, "🔮");
  }
  if (lockEnabled && !unlocked) {
    return h(LockScreen, {
      themeId,
      onUnlock: () => setUnlocked(true),
      onForgot: forgotPin
    });
  }

  // Apply PNG backgrounds via inline style on .app and inject header/panel bg
  // via a dynamic <style> tag so CSS classes pick them up
  const dynamicCss = `
    .app      { background-color: ${currentTheme.fallback.appBg};    background-image: url("${currentTheme.assets.appBg}"); }
    .hdr      { background-color: ${currentTheme.fallback.headerBg}; background-image: url("${currentTheme.assets.headerBg}"); }
    .panel    { background-color: ${currentTheme.fallback.appBg};    background-image: url("${currentTheme.assets.appBg}"); }
    .panel-hdr{ background-color: ${currentTheme.fallback.headerBg}; background-image: url("${currentTheme.assets.headerBg}"); }
  `;
  return h('div', {
    style: {
      fontFamily: currentFont.stack,
      fontSize: normalizedFontSize
    }
  }, h('style', null, dynamicCss), h('div', {
    className: "app"
  }, view === "home" && h(HomeView, {
    entries,
    themeId,
    themeStar: currentTheme.vars["--star"],
    onOpenEntry: entry => {
      setActiveEntry(entry);
      setView("read");
    },
    onNewEntry: () => {
      setActiveEntry(null);
      setView("new");
    },
    onSettings: () => setView("settings")
  }), (view === "new" || view === "edit") && h(EntryEditor, {
    key: view + (activeEntry?.id || activeEntry?.date || ""),
    initial: view === "edit" ? activeEntry : null,
    onSave: handleSaveEntry,
    onBack: () => setView(view === "edit" ? "read" : "home")
  }), view === "read" && activeEntry && h(EntryReader, {
    entry: activeEntry,
    onBack: () => setView("home"),
    onEdit: () => setView("edit"),
    onDelete: () => openConfirm({
      title: "Delete this entry?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => handleDeleteEntry(activeEntry.id)
    })
  }), view === "settings" && h(SettingsView, {
    themeId,
    font,
    fontSize,
    lockEnabled,
    onChangeTheme: changeTheme,
    onChangeFont: changeFont,
    onChangeFontSize: changeFontSize,
    onLockEnabled: () => setLockEnabled(true),
    onLockDisabled: () => setLockEnabled(false),
    onRequestLockDisable: requestDisableLock,
    onDeleteAll: () => openConfirm({
      title: "Delete entire diary?",
      message: "All entries will be permanently removed.",
      confirmLabel: "Delete All",
      onConfirm: async () => {
        await clearAllEntries();
        setEntries([]);
        setView("home");
        showFeedback("All entries deleted", "success");
      }
    }),
    onBack: () => setView("home")
  }), feedback && h('div', {
    className: `toast toast-${feedback.type}`,
    role: "status",
    "aria-live": "polite"
  }, feedback.message), confirmState && h('div', {
    className: "confirm-overlay",
    onClick: closeConfirm
  }, h('div', {
    className: "confirm-sheet",
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-modal": "true",
    "aria-label": confirmState.title
  }, h('div', {
    className: "confirm-title"
  }, confirmState.title), h('div', {
    className: "confirm-message"
  }, confirmState.message), h('div', {
    className: "confirm-actions"
  }, h('button', {
    className: "confirm-btn",
    onClick: closeConfirm
  }, "Cancel"), h('button', {
    className: "confirm-btn confirm-btn-danger",
    onClick: runConfirm
  }, confirmState.confirmLabel))))));
}