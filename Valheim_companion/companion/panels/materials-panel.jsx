import { useState, useMemo } from "react";
import { BIOME_COLORS, BIOME_ICONS } from "../../constants.jsx";

function MaterialList({ biome, allItems, onBack }) {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const MATERIAL_TYPES = ["Material", "Misc", "Utility", "Trophy"];

  const items = useMemo(() => allItems.filter((item) => {
    if (!MATERIAL_TYPES.includes(item.type)) return false;
    if (item.biome !== biome) return false;
    const q = search.toLowerCase();
    if (q && !item.name.toLowerCase().includes(q) && !(item.desc || "").toLowerCase().includes(q)) return false;
    return true;
  }), [biome, search, allItems]);

  return (
    <div>
      <div className="panel-head-row material-list-head">
        <button className="panel-back-btn" onClick={onBack}>← Back</button>
        <div>
          <h2 className="panel-title" style={{ color: BIOME_COLORS[biome] }}>{BIOME_ICONS[biome]} {biome}</h2>
          <p className="panel-subtitle">Materials found in this biome</p>
        </div>
      </div>

      <input className="search-input material-search" placeholder={`Search ${biome} materials...`} value={search}
        onChange={(e) => { setSearch(e.target.value); setSelectedItem(null); }} />

      <div className="material-item-count">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </div>

      <div className="panel-stack">
        {items.map((item, i) => (
          <div key={i} onClick={() => setSelectedItem(selectedItem === i ? null : i)}
            className="material-item-card" style={{ background: selectedItem === i ? "#1c1a10" : "#141814", borderColor: selectedItem === i ? BIOME_COLORS[biome] : "#1e2320" }}>
            <div className="material-item-row">
              <div className="material-item-info">
                <div className="material-item-name">{item.name}</div>
                <div className="material-item-type">{item.type}</div>
              </div>
              {item.recipe && (
                <div className="material-item-recipe">
                  {item.recipe.split("→")[0].trim()}
                </div>
              )}
              <span className="material-item-chevron" style={{ color: selectedItem === i ? BIOME_COLORS[biome] : "#3a3a2a" }}>{selectedItem === i ? "▲" : "▼"}</span>
            </div>

            {selectedItem === i && (
              <div className="material-detail-section">
                <p className="material-detail-desc">{item.desc}</p>
                {item.recipe ? (
                  <div className="material-recipe-box">
                    <div className="material-recipe-title">🔨 How to get</div>
                    <div className="material-recipe-text">{item.recipe}</div>
                  </div>
                ) : (
                  <div className="material-no-recipe">No source data yet</div>
                )}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="panel-empty">The ravens found nothing...</div>
        )}
      </div>
    </div>
  );
}

export function MaterialsPanel({ allItems }) {
  const [activeBiome, setActiveBiome] = useState(null);
  const BIOMES = ["Meadows", "Black Forest", "Swamp", "Mountain", "Plains", "Ocean", "Mistlands", "Ashlands"];
  const MATERIAL_TYPES = ["Material", "Misc", "Utility", "Trophy"];

  if (activeBiome) {
    return <MaterialList biome={activeBiome} allItems={allItems} onBack={() => setActiveBiome(null)} />;
  }

  return (
    <div>
      <p className="panel-subtitle materials-intro" style={{ color: "#5a5a4a" }}>
        Choose a biome to browse its materials, ores, trophies and tools
      </p>
      <div className="materials-grid">
        {BIOMES.map((biome) => {
          const biomeItems = allItems.filter((item) => MATERIAL_TYPES.includes(item.type) && item.biome === biome);
          const byType = biomeItems.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {});
          const preview = biomeItems.filter((item) => item.recipe).slice(0, 3);

          return (
            <div key={biome} onClick={() => setActiveBiome(biome)}
              className="biome-card panel-overview-card" style={{ border: `1px solid ${BIOME_COLORS[biome]}44` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = BIOME_COLORS[biome]; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${BIOME_COLORS[biome]}44`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="biome-card-header">
                <span className="biome-card-icon">{BIOME_ICONS[biome]}</span>
                <div className="biome-card-info">
                  <div className="biome-card-title" style={{ color: BIOME_COLORS[biome] }}>{biome.toUpperCase()}</div>
                  <div className="biome-card-count">{biomeItems.length} items</div>
                </div>
              </div>

              <div className="material-type-tags">
                {Object.entries(byType).map(([type, count]) => (
                  <span key={type} className="material-type-tag">
                    {count} {type}
                  </span>
                ))}
              </div>

              {preview.length > 0 && (
                <div className="biome-preview-section">
                  {preview.map((item, i) => (
                    <div key={i} className="biome-preview-item">
                      <span className="biome-preview-arrow" style={{ color: BIOME_COLORS[biome] }}>▸</span>
                      <span className="biome-preview-name">{item.name}</span>
                      <span className="biome-preview-source">— {(item.recipe || "").split("→")[0].trim().split(" ").slice(0, 4).join(" ")}...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
