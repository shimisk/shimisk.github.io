import React, { useState } from "react";
import { THEMES } from "../themes.js";
import { hashPin } from "../utils.js";
import { getSetting } from "../db.js";

const h = React.createElement;

export default function LockScreen({ themeId, onUnlock, onForgot }) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [tries, setTries] = useState(0);

  const theme = THEMES[themeId] || THEMES.witchy;

  const submit = async p => {
    const hash   = await hashPin(p);
    const stored = await getSetting("pinHash");
    if (hash === stored) {
      onUnlock();
    } else {
      setTries(t => t + 1);
      setError(true); setShake(true); setPin("");
      setTimeout(() => setShake(false), 600);
    }
  };

  const press = d => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError(false); setPin(next);
    if (next.length === 4) submit(next);
  };

  return h('div', { className: "lock-screen", style: { backgroundColor: theme.fallback.appBg, backgroundImage: `url("${theme.assets.appBg}")` } },
    h('div', { className: "lock-wrap" },
      h('div', { className: "lock-icon" }, "🔒"),
      h('div', { className: "lock-title" }, "My Diary"),
      h('div', { className: `pin-dots${shake ? " shake" : ""}` },
        [0,1,2,3].map(i => h('div', { key: i, className: `pin-dot${pin.length > i ? " filled" : ""}` }))
      ),
      h('div', { className: "pin-error" }, error ? `Wrong PIN${tries >= 3 ? ` · ${tries} attempts` : ""}` : ""),
      h('div', { className: "numpad" },
        ["1","2","3","4","5","6","7","8","9"].map(d =>
          h('button', { key: d, className: "num-btn", onClick: () => press(d) }, d)
        ),
        h('div'),
        h('button', { className: "num-btn", onClick: () => press("0") }, "0"),
        h('button', { className: "num-btn del", onClick: () => { setPin(p => p.slice(0,-1)); setError(false); } }, "⌫")
      ),
      tries >= 3 && h('button', { className: "lock-forgot", onClick: onForgot }, "Forgot PIN? (wipes diary)")
    )
  );
}
