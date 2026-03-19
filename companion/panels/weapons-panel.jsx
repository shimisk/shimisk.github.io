import { useState, useMemo } from "react";
import { BIOME_TIER, BIOME_COLORS, BIOME_ICONS, getCurrentBiome, buildWeaponCategories } from "../../constants.jsx";

function getWeaponsForCategory(category, allItems) {
  return allItems.filter((item) => {
    if (!["OneHandedWeapon", "TwoHandedWeapon", "Bow", "Ammo", "Throwable", "MagicWeapon", "Shield"].includes(item.type)) return false;
    return category.match(item);
  });
}

function getBestWeaponForCategory(category, currentBiomeTier, allItems) {
  const available = getWeaponsForCategory(category, allItems).filter((weapon) =>
    weapon.biome && weapon.biome !== "Unknown" && (BIOME_TIER[weapon.biome] || 0) <= currentBiomeTier
  );
  if (!available.length) return null;
  return available.sort((a, b) => (BIOME_TIER[b.biome] || 0) - (BIOME_TIER[a.biome] || 0))[0];
}

function WeaponCategory({ category, onBack, allItems }) {
  const [sort, setSort] = useState("tier");
  const [selectedId, setSelectedId] = useState(null);

  const weapons = useMemo(() => getWeaponsForCategory(category, allItems), [category, allItems]);
  const sorted = useMemo(() => {
    const copy = [...weapons];
    if (sort === "tier") return copy.sort((a, b) => (BIOME_TIER[a.biome] || 0) - (BIOME_TIER[b.biome] || 0));
    if (sort === "tier-desc") return copy.sort((a, b) => (BIOME_TIER[b.biome] || 0) - (BIOME_TIER[a.biome] || 0));
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }, [weapons, sort]);

  return (
    <div>
      <div className="panel-head-row" style={{ marginBottom: 24 }}>
        <button className="panel-back-btn" onClick={onBack}>← Back</button>
        <div>
          <h2 className="panel-title" style={{ color: "#d4aa60" }}>{category.emoji} {category.label}</h2>
          <p className="panel-subtitle">{category.desc}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#4a4a3a", fontFamily: "'Crimson Text',serif" }}>Sort:</span>
          {[["tier", "⬆ Weakest"], ["tier-desc", "⬇ Strongest"], ["name", "A-Z"]].map(([value, label]) => (
            <button key={value} onClick={() => setSort(value)} style={{ background: sort === value ? "#2a2218" : "#141814", border: "1px solid", borderColor: sort === value ? "#d4aa60" : "#2a2f2a", color: sort === value ? "#d4aa60" : "#6a6a5a", fontFamily: "'Crimson Text',serif", fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="panel-stack">
        {sorted.map((weapon, i) => (
          <div key={i} onClick={() => setSelectedId(selectedId === i ? null : i)}
            style={{ background: selectedId === i ? "#1c1a10" : "#141814", border: "1px solid", borderColor: selectedId === i ? "#d4aa60" : "#1e2320", borderRadius: 8, padding: "14px 18px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22 }}>{category.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e8dfc8" }}>{weapon.name}</div>
                {weapon.biome && weapon.biome !== "Unknown" && <div style={{ fontSize: 11, color: BIOME_COLORS[weapon.biome], marginTop: 2 }}>{BIOME_ICONS[weapon.biome]} {weapon.biome}</div>}
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {[1, 2, 3, 4, 5, 6, 7].map((tier) => <div key={tier} style={{ width: 6, height: 16, borderRadius: 2, background: tier <= (BIOME_TIER[weapon.biome] || 0) ? "#d4aa60" : "#2a2a2a", opacity: tier <= (BIOME_TIER[weapon.biome] || 0) ? 0.4 + tier * 0.09 : 1 }} />)}
              </div>
              <span style={{ fontSize: 16, color: selectedId === i ? "#d4aa60" : "#3a3a2a", flexShrink: 0 }}>{selectedId === i ? "▲" : "▼"}</span>
            </div>
            {selectedId === i && (
              <div style={{ marginTop: 14, borderTop: "1px solid #2a2a1a", paddingTop: 14 }}>
                <p style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, color: "#8a7a60", fontStyle: "italic", marginBottom: 12, lineHeight: 1.5 }}>{weapon.desc}</p>
                {weapon.recipe ? (
                  <div style={{ background: "#0e120e", border: "1px solid #2a3a1a", borderRadius: 6, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "#4a6a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>🔨 Recipe</div>
                    <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 14, color: "#8aaa6a", lineHeight: 1.6 }}>{weapon.recipe}</div>
                  </div>
                ) : <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#3a4a3a", fontStyle: "italic" }}>No recipe data</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeaponsPanel({ bosses, weaponCategories, allItems }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const currentBiome = useMemo(() => getCurrentBiome(bosses), [bosses]);
  const currentTier = useMemo(() => BIOME_TIER[currentBiome] || 1, [currentBiome]);
  const categories = useMemo(() => buildWeaponCategories(weaponCategories), [weaponCategories]);

  if (activeCategory) {
    const category = categories.find((c) => c.id === activeCategory);
    return <WeaponCategory category={category} onBack={() => setActiveCategory(null)} allItems={allItems} />;
  }

  return (
    <div>
      <div className="panel-current-zone">
        <span style={{ fontSize: 22 }}>{BIOME_ICONS[currentBiome]}</span>
        <div>
          <div className="panel-current-zone-label">Current zone</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: BIOME_COLORS[currentBiome], letterSpacing: 1 }}>{currentBiome}</div>
        </div>
        <div className="panel-current-zone-note">
          Showing best available · update in <span style={{ color: "#d4aa60" }}>Bosses</span> tab
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {categories.map((category) => {
          const all = getWeaponsForCategory(category, allItems);
          if (!all.length) return null;
          const best = getBestWeaponForCategory(category, currentTier, allItems);
          const locked = !best;
          return (
            <div key={category.id} onClick={() => setActiveCategory(category.id)}
              style={{ background: locked ? "#111412" : "linear-gradient(135deg,#1a1f1a 0%,#141814 100%)", border: "1px solid", borderColor: locked ? "#1e2320" : "#2a2f2a", borderRadius: 10, padding: "20px 18px", cursor: "pointer", transition: "all 0.25s", opacity: locked ? 0.5 : 1 }}
              onMouseEnter={(e) => { if (!locked) { e.currentTarget.style.borderColor = "#5a4a2a"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = locked ? "#1e2320" : "#2a2f2a"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 32 }}>{category.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#d4aa60", letterSpacing: 1.5 }}>{category.label.toUpperCase()}</div>
                  <div style={{ fontSize: 10, color: "#4a4a3a", fontFamily: "'Crimson Text',serif", fontStyle: "italic" }}>{all.length} weapons</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#5a5a4a", fontStyle: "italic", marginBottom: 14, lineHeight: 1.4 }}>{category.desc}</div>
              {best ? (
                <div style={{ background: "#0e120e", border: "1px solid #2a3a1a", borderRadius: 6, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: "#4a6a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>✦ Best available</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#c4e890" }}>{best.name}</div>
                  <div style={{ fontSize: 11, color: BIOME_COLORS[best.biome], marginTop: 2 }}>{BIOME_ICONS[best.biome]} {best.biome}</div>
                  <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((tier) => <div key={tier} style={{ flex: 1, height: 3, borderRadius: 2, background: tier <= (BIOME_TIER[best.biome] || 0) ? "#6aaa3a" : "#1e2320" }} />)}
                  </div>
                </div>
              ) : <div style={{ background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 6, padding: "8px 12px", fontFamily: "'Crimson Text',serif", fontSize: 12, color: "#3a3a3a", fontStyle: "italic" }}>🔒 Not yet unlocked</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
