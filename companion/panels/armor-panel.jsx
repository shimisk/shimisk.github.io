import { useState, useMemo } from "react";
import { BIOME_TIER, BIOME_COLORS, BIOME_ICONS, STYLE_COLORS, STYLE_ICONS, getCurrentBiome } from "../../constants.jsx";

function ArmorSetDetail({ set, onBack }) {
  return (
    <div>
      <div className="panel-head-row armor-detail-head">
        <button className="panel-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h2 className="panel-title" style={{ color: set.color }}>{set.icon} {set.name}</h2>
          <div className="armor-detail-meta">
            <span className="armor-detail-biome" style={{ color: BIOME_COLORS[set.biome] }}>{BIOME_ICONS[set.biome]} {set.biome}</span>
            <span className="armor-style-badge" style={{ color: STYLE_COLORS[set.style] || "#8a7a5a" }}>
              {STYLE_ICONS[set.style]} {set.playstyle}
            </span>
          </div>
        </div>
      </div>

      <p className="panel-subtitle armor-detail-desc" style={{ color: "#8a7a60" }}>{set.desc}</p>

      <div className={`armor-bonus-box ${set.bonus.includes("No set bonus") ? "no-bonus" : "has-bonus"}`}>
        <div className="armor-bonus-title">✦ Set Bonus</div>
        <div className="armor-bonus-text">{set.bonus}</div>
      </div>

      <div>
        <div className="armor-pieces-label">Armor Pieces</div>
        <div className="armor-pieces-list">
          {set.pieces.map((piece, i) => (
            <div key={i} className="armor-piece-card">
              <div className="armor-piece-header">
                <span className="armor-piece-type">{piece.type}</span>
                <span className="armor-piece-name">{piece.name}</span>
              </div>
              <div className="armor-piece-recipe">🔨 {piece.recipe}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="armor-materials-box">
        <div className="armor-materials-title">📦 Total Materials Needed</div>
        <div className="armor-materials-text">{set.totalMats}</div>
      </div>
    </div>
  );
}

export function ArmorPanel({ bosses, armorSets }) {
  const [activeSet, setActiveSet] = useState(null);

  const currentBiome = useMemo(() => getCurrentBiome(bosses), [bosses]);
  const currentTier = useMemo(() => BIOME_TIER[currentBiome] || 1, [currentBiome]);

  if (activeSet) {
    const set = armorSets.find((s) => s.id === activeSet);
    return <ArmorSetDetail set={set} onBack={() => setActiveSet(null)} />;
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
          Sets dimmed if not yet reachable · update in <span style={{ color: "#d4aa60" }}>Bosses</span> tab
        </div>
      </div>

      <div className="armor-grid">
        {armorSets.map((set) => {
          const unlocked = set.tier <= currentTier;
          const bestTierForStyle = Math.max(...armorSets.filter((s) => s.tier <= currentTier && s.style === set.style).map((s) => s.tier));
          const isBest = set.tier === bestTierForStyle;

          return (
            <div key={set.id} onClick={() => setActiveSet(set.id)}
              className={`armor-set-card ${unlocked ? "armor-set-card--unlocked" : "armor-set-card--locked"}`}
              style={{ borderColor: isBest && unlocked ? set.color : unlocked ? "#2a2f2a" : "#1a1a1a" }}
              onMouseEnter={(e) => { if (unlocked) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

              {isBest && unlocked && (
                <div className="armor-badge armor-badge--best">✦ BEST</div>
              )}
              {!unlocked && (
                <div className="armor-badge armor-badge--locked">🔒 LOCKED</div>
              )}

              <div className="armor-card-header">
                <span className="armor-card-icon">{set.icon}</span>
                <div>
                  <div className="armor-card-title" style={{ color: unlocked ? set.color : "#3a3a3a" }}>{set.name}</div>
                  <div className="armor-card-biome" style={{ color: unlocked ? BIOME_COLORS[set.biome] : "#2a2a2a" }}>{BIOME_ICONS[set.biome]} {set.biome}</div>
                </div>
              </div>

              <div className="armor-card-playstyle">
                <span className="armor-playstyle-badge" style={{ color: unlocked ? (STYLE_COLORS[set.style] || "#8a7a5a") : "#2a2a2a" }}>
                  {STYLE_ICONS[set.style]} {set.playstyle}
                </span>
              </div>

              <p className="armor-card-desc" style={{ color: unlocked ? "#5a5a4a" : "#2a2a2a" }}>{set.desc.split(".")[0]}.</p>

              <div className="armor-pieces-tags" style={{ marginBottom: set.bonus && !set.bonus.includes("No set bonus") ? 10 : 0 }}>
                {set.pieces.map((piece, i) => (
                  <span key={i} className="armor-piece-tag" style={{ color: unlocked ? "#5a6a5a" : "#2a2a2a" }}>{piece.type}</span>
                ))}
              </div>

              {!set.bonus.includes("No set bonus") && (
                <div className="armor-card-bonus">
                  <div className="armor-card-bonus-title" style={{ color: unlocked ? "#4a7a4a" : "#1e2e1e" }}>✦ Set bonus</div>
                  <div className="armor-card-bonus-text" style={{ color: unlocked ? "#7aaa5a" : "#2a3a2a" }}>{set.bonus.split(".")[0]}.</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
