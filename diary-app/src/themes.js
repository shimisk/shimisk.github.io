export const THEMES = {
  witchy: {
    label: "Witchy",
    icon: "🔮",
    vars: {
      "--bg":       "#0d0a1a",
      "--surface":  "#1a1030",
      "--surface2": "#231644",
      "--border":   "#3d2b6e",
      "--accent":   "#9b59b6",
      "--accent2":  "#6c3483",
      "--accent3":  "#ffdf70",
      "--text":     "#ffe9a8",
      "--text2":    "#ffd700",
      "--text3":    "#ffbf3c",
      "--textGlow": "0 0 10px rgba(255,215,0,0.75), 0 0 20px rgba(255,191,60,0.45), 0 0 30px rgba(255,215,0,0.25)",
      "--titleFont": "'Dancing Script', cursive",
      "--titleGlow": "0 0 12px rgba(255,215,0,0.9), 0 0 24px rgba(255,191,60,0.65), 0 0 36px rgba(255,215,0,0.4)",
      "--glow":     "rgba(155,89,182,0.4)",
      "--star":     "⭐",
    },
    assets: {
      appBg:    "assets/witchy/bg.png",
      headerBg: "assets/witchy/header.png",
      cards: [
        "assets/witchy/card-1.png",
        "assets/witchy/card-2.png",
        "assets/witchy/card-3.png",
        "assets/witchy/card-4.png",
        "assets/witchy/card-5.png",
      ],
    },
    fallback: {
      appBg:    "#0d0a1a",
      headerBg: "#150e2b",
      cards:    ["#1a0a2e","#0d1a2e","#1a0a1a","#0a1a1a","#1a1a0a"],
    },
  },

  // cutsie: {
  //   label: "Cutsie",
  //   icon: "🌸",
  //   vars: {
  //     "--bg":       "#fff0f5",
  //     "--surface":  "#ffffff",
  //     "--surface2": "#fff5f9",
  //     "--border":   "#f9a8c9",
  //     "--accent":   "#f06292",
  //     "--accent2":  "#e91e8c",
  //     "--accent3":  "#880e4f",
  //     "--text":     "#4a1535",
  //     "--text2":    "#ad1457",
  //     "--text3":    "#f48fb1",
  //     "--glow":     "rgba(240,98,146,0.25)",
  //     "--star":     "🌸",
  //   },
  //   assets: {
  //     appBg:    "assets/cutsie/bg.png",
  //     headerBg: "assets/cutsie/header.png",
  //     cards: [
  //       "assets/cutsie/card-1.png",
  //       "assets/cutsie/card-2.png",
  //       "assets/cutsie/card-3.png",
  //       "assets/cutsie/card-4.png",
  //       "assets/cutsie/card-5.png",
  //     ],
  //   },
  //   fallback: {
  //     appBg:    "#fff0f5",
  //     headerBg: "#ffe4ef",
  //     cards:    ["#ffe4ef","#e4eeff","#e4ffee","#ffffe4","#f0e4ff"],
  //   },
  // },

  // goth: {
  //   label: "Goth",
  //   icon: "🖤",
  //   vars: {
  //     "--bg":       "#0a0a0a",
  //     "--surface":  "#141414",
  //     "--surface2": "#1c1c1c",
  //     "--border":   "#2a2a2a",
  //     "--accent":   "#cc0000",
  //     "--accent2":  "#8b0000",
  //     "--accent3":  "#ff4444",
  //     "--text":     "#d4c5b0",
  //     "--text2":    "#8a7a6a",
  //     "--text3":    "#4a4040",
  //     "--glow":     "rgba(204,0,0,0.3)",
  //     "--star":     "💀",
  //   },
  //   assets: {
  //     appBg:    "assets/goth/bg.png",
  //     headerBg: "assets/goth/header.png",
  //     cards: [
  //       "assets/goth/card-1.png",
  //       "assets/goth/card-2.png",
  //       "assets/goth/card-3.png",
  //       "assets/goth/card-4.png",
  //       "assets/goth/card-5.png",
  //     ],
  //   },
  //   fallback: {
  //     appBg:    "#0a0a0a",
  //     headerBg: "#111111",
  //     cards:    ["#1a0000","#0a0a0a","#000a1a","#0a001a","#001a0a"],
  //   },
  // },
};

// ─── Sticker Categories ───────────────────────────────────────────────────
// To add a category: add a new key with label, icon, stickers[].
// When you have real PNG stickers, swap emoji for image paths and
// update StickerPicker.js to render <img> instead of text.

export const STICKER_CATEGORIES = {
  mood: {
    label: "Mood",
    icon: "🌙",
    stickers: [
      "assets/witchy/stickers/angry.png",
      "assets/witchy/stickers/anxious.png",
      "assets/witchy/stickers/cozy.png",
      "assets/witchy/stickers/exhaust.png",
      "assets/witchy/stickers/happy.png",
      "assets/witchy/stickers/in-love.png",
      "assets/witchy/stickers/magical.png",
      "assets/witchy/stickers/mysterious.png",
      "assets/witchy/stickers/sad.png",
      "assets/witchy/stickers/sleepy.png",
    ],
  },
};
