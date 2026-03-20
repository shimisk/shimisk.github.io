import React, { useState } from "react";
import { hashPin } from "../utils.js";
import { getSetting, setSetting } from "../db.js";

const h = React.createElement;

const LABELS = {
  enter_current: "Enter current PIN",
  enter_new:     "Choose a 4-digit PIN",
  confirm_new:   "Confirm your PIN",
};

export default function PinSetup({ hasExisting, onDone, onCancel }) {
  const [step,   setStep]   = useState(hasExisting ? "enter_current" : "enter_new");
  const [pin,    setPin]    = useState("");
  const [newPin, setNewPin] = useState("");
  const [error,  setError]  = useState("");
  const [shake,  setShake]  = useState(false);

  const doShake = msg => {
    setError(msg); setShake(true); setPin("");
    setTimeout(() => setShake(false), 600);
  };

  const advance = async p => {
    if (step === "enter_current") {
      const hash = await hashPin(p);
      const stored = await getSetting("pinHash");
      if (hash !== stored) { doShake("Wrong PIN"); return; }
      setStep("enter_new"); setPin(""); setError("");
    } else if (step === "enter_new") {
      setNewPin(p); setStep("confirm_new"); setPin(""); setError("");
    } else if (step === "confirm_new") {
      if (p !== newPin) { doShake("PINs don't match"); setStep("enter_new"); setNewPin(""); return; }
      await setSetting("pinHash", await hashPin(p));
      await setSetting("lockEnabled", true);
      onDone();
    }
  };

  const press = d => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError(""); setPin(next);
    if (next.length === 4) advance(next);
  };

  return h('div', { className: "pin-setup-overlay" },
    h('div', { className: "pin-setup-sheet" },
      h('div', { className: "setup-handle" }, h('div', { className: "setup-handle-bar" })),
      h('div', { className: "setup-top" },
        h('span', { className: "setup-title" }, LABELS[step]),
        h('button', { className: "setup-cancel", onClick: onCancel }, "Cancel")
      ),
      h('div', { className: `setup-dots${shake ? " shake" : ""}` },
        [0,1,2,3].map(i => h('div', { key: i, className: `setup-dot${pin.length > i ? " filled" : ""}` }))
      ),
      h('div', { className: "setup-error" }, error),
      h('div', { className: "setup-step" }, LABELS[step]),
      h('div', { className: "setup-numpad" },
        ["1","2","3","4","5","6","7","8","9"].map(d =>
          h('button', { key: d, className: "setup-num", onClick: () => press(d) }, d)
        ),
        h('div'),
        h('button', { className: "setup-num", onClick: () => press("0") }, "0"),
        h('button', { className: "setup-num del", onClick: () => { setPin(p => p.slice(0,-1)); setError(""); } }, "⌫")
      )
    )
  );
}
