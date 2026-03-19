import { useState, useEffect, useRef } from "react";

export function TabBar({ mainTabs, tab, setTab }) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const ref = useRef(null);

  const update = (el) => {
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update(el);
    const observer = new ResizeObserver(() => update(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="tab-scroll-wrap">
      <div className="tab-bar" ref={ref} onScroll={(e) => update(e.currentTarget)}>
        {mainTabs.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="tab-scroll-fade tab-scroll-fade-left" style={{ opacity: showLeft ? 1 : 0 }}>
        <span className="tab-scroll-arrow">‹</span>
      </div>
      <div className="tab-scroll-fade tab-scroll-fade-right" style={{ opacity: showRight ? 1 : 0 }}>
        <span className="tab-scroll-arrow">›</span>
      </div>
    </div>
  );
}
