import { useState, useMemo } from "react";
import { BIOME_TIER, BIOME_COLORS, BIOME_ICONS, getCurrentBiome, buildFoodCategories } from "../../constants.jsx";

function FoodList({ category, bosses, allItems, onBack }) {
  const [activeBiome, setActiveBiome] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const BIOMES = ["Meadows", "Black Forest", "Swamp", "Mountain", "Plains", "Ocean", "Mistlands", "Ashlands"];

  const currentBiome = useMemo(() => getCurrentBiome(bosses), [bosses]);
  const currentTier = BIOME_TIER[currentBiome] || 1;

  const foods = useMemo(() => {
    const items = Array.isArray(allItems) ? allItems : [];
    return items.filter((item) => {
      if (!["Consumable", "Fish"].includes(item?.type)) return false;
      if ((item.foodCategory || "potion") !== category.id) return false;
      const q = search.toLowerCase();
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (activeBiome !== "All" && item.biome !== activeBiome) return false;
      return true;
    }).sort(category.sortKey || (() => 0));
  }, [category, activeBiome, search, allItems]);

  return (
    <div>
      <div className="panel-head-row">
        <button className="panel-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h2 className="panel-title" style={{ color: category.color }}>{category.emoji} {category.label}</h2>
          <p className="panel-subtitle">{category.desc}</p>
        </div>
        <div className="panel-current-zone-note">
          {BIOME_ICONS[currentBiome]} <span style={{ color: BIOME_COLORS[currentBiome] }}>{currentBiome}</span>
        </div>
      </div>

      <input className="search-input" placeholder={`Search ${category.label.toLowerCase()} food...`} value={search}
        style={{ marginBottom: 10 }} onChange={(e) => { setSearch(e.target.value); setSelectedItem(null); }} />

      <div className="food-filter-row">
        <button className="biome-btn" onClick={() => { setActiveBiome("All"); setSelectedItem(null); }}
          style={{ borderColor: activeBiome === "All" ? "#d4aa60" : "#2a2f2a", color: activeBiome === "All" ? "#d4aa60" : "#8a7a5a" }}>🗺 All</button>
        {BIOMES.map((biome) => (
          <button key={biome} className="biome-btn" onClick={() => { setActiveBiome(biome); setSelectedItem(null); }}
            style={{ borderColor: activeBiome === biome ? BIOME_COLORS[biome] : "#2a2f2a", color: activeBiome === biome ? BIOME_COLORS[biome] : "#6a6a5a" }}>
            {BIOME_ICONS[biome]} {biome}
          </button>
        ))}
      </div>

      <div className="food-item-count">
        {foods.length} item{foods.length !== 1 ? "s" : ""}
        {activeBiome !== "All" && <span style={{ color: BIOME_COLORS[activeBiome], marginLeft: 8 }}>in {activeBiome}</span>}
      </div>

      <div className="panel-stack">
        {foods.map((item, i) => {
          const isAvailable = !item.biome || item.biome === "Unknown" || (BIOME_TIER[item.biome] || 0) <= currentTier;
          return (
            <div key={i} onClick={() => setSelectedItem(selectedItem === i ? null : i)}
              className="panel-card" style={{ background: selectedItem === i ? "#1c1a10" : "#141814", borderColor: selectedItem === i ? category.color : "#1e2320", opacity: isAvailable ? 1 : 0.4 }}>
              <div className="food-card-row">
                <span style={{ fontSize: 20 }}>🍽</span>
                <div style={{ flex: 1 }}>
                  <div className="food-item-name" style={{ color: isAvailable ? "#e8dfc8" : "#4a4a4a" }}>{item.name}</div>
                  {item.biome && item.biome !== "Unknown" && (
                    <div className="food-item-biome" style={{ color: BIOME_COLORS[item.biome] }}>{BIOME_ICONS[item.biome]} {item.biome}</div>
                  )}
                </div>

                {category.id !== "potion" && item.health != null && (
                  <div className="stat-bars">
                    <div className="stat-bar-row">
                      <span style={{ fontSize: 11, color: "#c04a4a", width: 14 }}>❤️</span>
                      <div className="stat-bar-container" style={{ background: "#1a1010" }}>
                        <div className="stat-bar-fill" style={{ width: `${Math.min((item.health / 110) * 100, 100)}%`, background: "#c04a4a" }} />
                      </div>
                      <span className="stat-value" style={{ color: "#c06a6a" }}>{item.health}</span>
                    </div>
                    <div className="stat-bar-row">
                      <span style={{ fontSize: 11, color: "#4a8acc", width: 14 }}>⚡</span>
                      <div className="stat-bar-container" style={{ background: "#101520" }}>
                        <div className="stat-bar-fill" style={{ width: `${Math.min((item.stamina / 110) * 100, 100)}%`, background: "#4a8acc" }} />
                      </div>
                      <span className="stat-value" style={{ color: "#6aaacc" }}>{item.stamina}</span>
                    </div>
                    {(item.eitr || 0) > 0 && (
                      <div className="stat-bar-row">
                        <span style={{ fontSize: 11, color: "#8a2be2", width: 14 }}>🔮</span>
                        <div className="stat-bar-container" style={{ background: "#120e1a" }}>
                          <div className="stat-bar-fill" style={{ width: `${Math.min(((item.eitr || 0) / 110) * 100, 100)}%`, background: "#8a2be2" }} />
                        </div>
                        <span className="stat-value" style={{ color: "#aa6aee" }}>{item.eitr || 0}</span>
                      </div>
                    )}
                    {item.duration > 0 && (
                      <div style={{ fontSize: 10, color: "#3a4a3a", textAlign: "right", fontFamily: "'Crimson Text',serif" }}>⏱ {Math.floor(item.duration / 60)}m</div>
                    )}
                  </div>
                )}

                {category.id === "potion" && item.special && (
                  <div className="food-special" style={{ color: "#9a6a9a" }}>{item.special}</div>
                )}

                <span className="food-item-chevron" style={{ color: selectedItem === i ? category.color : "#3a3a2a" }}>{selectedItem === i ? "▲" : "▼"}</span>
              </div>

              {selectedItem === i && (
                <div style={{ marginTop: 12, borderTop: "1px solid #2a2a1a", paddingTop: 12 }}>
                  <p className="food-description">{item.desc}</p>
                  {item.recipe && (
                    <div className="recipe-box">
                      <div className="recipe-title">🔨 Recipe</div>
                      <div className="recipe-text">{item.recipe}</div>
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="food-unlock-msg" style={{ color: "#6a4a3a" }}>
                      🔒 Requires reaching {item.biome}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {foods.length === 0 && (
          <div className="panel-empty">The ravens found nothing...</div>
        )}
      </div>
    </div>
  );
}

function BestComboPanel({ combo, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const foods = Array.isArray(combo?.foods) ? combo.foods : [];

  if (foods.length === 0) {
    return (
      <div>
        <div className="panel-head-row">
          <button className="panel-back-btn" onClick={onBack}>← Back</button>
          <div>
            <h2 className="panel-title" style={{ color: combo?.color || "#8a2be2" }}>{combo?.emoji || "🔮"} {combo?.label || "Combo"}</h2>
            <p className="panel-subtitle">{combo?.desc || "No combo information available."}</p>
          </div>
        </div>
        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#8a7a60", padding: 18 }}>Unable to generate a combo right now — there are not enough foods in this category.</div>
      </div>
    );
  }

  const totalH = foods.reduce((sum, food) => sum + (food.health || 0), 0);
  const totalS = foods.reduce((sum, food) => sum + (food.stamina || 0), 0);
  const totalE = foods.reduce((sum, food) => sum + (food.eitr || 0), 0);

  const StatBar = ({ icon, value, color, grad, bg, max = 320 }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color, width: 16 }}>{icon}</span>
      <div style={{ flex: 1, background: bg, borderRadius: 4, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${grad})`, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: grad, width: 36, textAlign: "right", fontFamily: "'Crimson Text',serif" }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div className="panel-head-row">
        <button className="panel-back-btn" onClick={onBack}>← Back</button>
        <div>
          <h2 className="panel-title" style={{ color: combo.color }}>{combo.emoji} {combo.label}</h2>
          <p className="panel-subtitle">{combo.desc}</p>
        </div>
      </div>

      <div className="combo-stats-box">
        <div className="combo-stats-title">Combined stats (3 foods)</div>
        <div className="combo-stats-bars">
          <StatBar icon="❤️" value={totalH} color="#c04a4a" grad="#e06a6a" bg="#1a1010" />
          <StatBar icon="⚡" value={totalS} color="#4a8acc" grad="#6aaaee" bg="#101520" />
          {totalE > 0 && <StatBar icon="🔮" value={totalE} color="#8a2be2" grad="#aa6aee" bg="#120e1a" />}
        </div>
      </div>

      <div className="grid-label">The 3 foods</div>
      <div className="panel-stack combo-foods-grid">
        {foods.map((food, i) => (
          <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
            className="panel-card" style={{ background: expanded === i ? "#1c1a10" : "#141814", borderColor: expanded === i ? combo.color : "#1e2320" }}>
            <div className="food-card-row">
              <div className="combo-number-badge" style={{ background: `${combo.color}22`, border: `1px solid ${combo.color}44`, color: combo.color }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="food-item-name" style={{ color: "#e8dfc8" }}>{food.name}</div>
                {food.biome && food.biome !== "Unknown" && <div className="food-item-biome" style={{ color: BIOME_COLORS[food.biome] }}>{BIOME_ICONS[food.biome]} {food.biome}</div>}
              </div>

              <div className="stat-bars" style={{ minWidth: 110 }}>
                <div className="stat-bar-row">
                  <span style={{ fontSize: 10, color: "#c04a4a" }}>❤️</span>
                  <div className="stat-bar-container" style={{ background: "#1a1010" }}><div className="stat-bar-fill" style={{ width: `${Math.min((food.health / 110) * 100, 100)}%`, background: "#c04a4a" }} /></div>
                  <span className="stat-value" style={{ color: "#c06a6a", width: 26 }}>{food.health}</span>
                </div>
                <div className="stat-bar-row">
                  <span style={{ fontSize: 10, color: "#4a8acc" }}>⚡</span>
                  <div className="stat-bar-container" style={{ background: "#101520" }}><div className="stat-bar-fill" style={{ width: `${Math.min((food.stamina / 110) * 100, 100)}%`, background: "#4a8acc" }} /></div>
                  <span className="stat-value" style={{ color: "#6aaacc", width: 26 }}>{food.stamina}</span>
                </div>
                {(food.eitr || 0) > 0 && (
                  <div className="stat-bar-row">
                    <span style={{ fontSize: 10, color: "#8a2be2" }}>🔮</span>
                    <div className="stat-bar-container" style={{ background: "#120e1a" }}><div className="stat-bar-fill" style={{ width: `${Math.min(((food.eitr || 0) / 110) * 100, 100)}%`, background: "#8a2be2" }} /></div>
                    <span className="stat-value" style={{ color: "#aa6aee", width: 26 }}>{food.eitr || 0}</span>
                  </div>
                )}
                {food.duration > 0 && <div style={{ fontSize: 10, color: "#3a4a3a", textAlign: "right", fontFamily: "'Crimson Text',serif" }}>⏱ {Math.floor(food.duration / 60)}m</div>}
              </div>
              <span style={{ fontSize: 14, color: expanded === i ? combo.color : "#3a3a2a", marginLeft: 8, flexShrink: 0 }}>{expanded === i ? "▲" : "▼"}</span>
            </div>

            {expanded === i && (
              <div style={{ marginTop: 12, borderTop: "1px solid #2a2a1a", paddingTop: 12 }}>
                <p className="food-description">{food.desc}</p>
                {food.recipe && (
                  <div className="recipe-box">
                    <div className="recipe-title">🔨 Recipe</div>
                    <div className="recipe-text">{food.recipe}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FoodPanel({ bosses, foodCategories, allItems }) {
  const [activeView, setActiveView] = useState(null);
  const categories = useMemo(() => buildFoodCategories(foodCategories), [foodCategories]);
  const yagluthDefeated = useMemo(() => bosses?.find((b) => b.id === 5)?.defeated || false, [bosses]);

  const currentBiome = useMemo(() => getCurrentBiome(bosses), [bosses]);
  const currentTier = BIOME_TIER[currentBiome] || 1;

  const availableFoods = useMemo(() =>
    allItems.filter((item) =>
      ["Consumable", "Fish"].includes(item.type) &&
      ["health", "stamina", "neutral", "eitr"].includes(item.foodCategory) &&
      ((item.health || 0) + (item.stamina || 0) + (item.eitr || 0) > 0) &&
      (BIOME_TIER[item.biome] || 0) <= currentTier
    ), [currentTier, allItems]);

  const combos = useMemo(() => {
    if (availableFoods.length < 3) return null;
    let bestH = null;
    let bestS = null;
    let bestAvg = null;
    let bestE = null;
    let maxH = 0;
    let maxS = 0;
    let maxAvg = 0;
    let maxE = 0;

    for (let a = 0; a < availableFoods.length; a++) {
      for (let b = a + 1; b < availableFoods.length; b++) {
        for (let c = b + 1; c < availableFoods.length; c++) {
          const trio = [availableFoods[a], availableFoods[b], availableFoods[c]];
          const health = trio.reduce((sum, food) => sum + (food.health || 0), 0);
          const stamina = trio.reduce((sum, food) => sum + (food.stamina || 0), 0);
          const eitr = trio.reduce((sum, food) => sum + (food.eitr || 0), 0);

          if (health > maxH) { maxH = health; bestH = trio; }
          if (stamina > maxS) { maxS = stamina; bestS = trio; }
          if (health + stamina > maxAvg) { maxAvg = health + stamina; bestAvg = trio; }
          if (eitr > maxE) { maxE = eitr; bestE = trio; }
        }
      }
    }

    return {
      health: { foods: bestH, totalH: maxH, totalS: bestH.reduce((sum, food) => sum + (food.stamina || 0), 0), totalE: bestH.reduce((sum, food) => sum + (food.eitr || 0), 0) },
      stamina: { foods: bestS, totalH: bestS.reduce((sum, food) => sum + (food.health || 0), 0), totalS: maxS, totalE: bestS.reduce((sum, food) => sum + (food.eitr || 0), 0) },
      avg: { foods: bestAvg, totalH: bestAvg.reduce((sum, food) => sum + (food.health || 0), 0), totalS: bestAvg.reduce((sum, food) => sum + (food.stamina || 0), 0), totalE: bestAvg.reduce((sum, food) => sum + (food.eitr || 0), 0) },
      eitr: { foods: bestE, totalH: bestE?.reduce((sum, food) => sum + (food.health || 0), 0) || 0, totalS: bestE?.reduce((sum, food) => sum + (food.stamina || 0), 0) || 0, totalE: maxE },
    };
  }, [availableFoods]);

  const comboConfig = {
    combo_health: { emoji: "❤️🏆", label: "Best Health Combo", desc: "Max health from 3 foods", color: "#c04a4a", key: "health" },
    combo_stamina: { emoji: "⚡🏆", label: "Best Stamina Combo", desc: "Max stamina from 3 foods", color: "#4a8acc", key: "stamina" },
    combo_avg: { emoji: "⚖️🏆", label: "Best Balanced Combo", desc: "Highest total health + stamina", color: "#8aaa4a", key: "avg" },
    combo_eitr: { emoji: "🔮🏆", label: "Best Eitr Combo", desc: "Max eitr from 3 foods — mage build", color: "#8a2be2", key: "eitr" },
  };

  if (activeView === "combo_eitr" && !yagluthDefeated) {
    return (
      <div>
        <div className="panel-head-row">
          <button className="panel-back-btn" onClick={() => setActiveView(null)}>← Back</button>
          <div>
            <h2 className="panel-title" style={{ color: "#8a2be2" }}>🔮🏆 Best Eitr Combo</h2>
            <p className="panel-subtitle">Max eitr from 3 foods — mage build</p>
          </div>
        </div>
        <div style={{ fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#8a7a60", padding: 18 }}>
          Defeat Yagluth to unlock Eitr food recommendations.
        </div>
      </div>
    );
  }

  if (activeView && activeView.startsWith("combo_") && combos) {
    const cfg = comboConfig[activeView];
    const data = combos[cfg.key];
    return <BestComboPanel combo={{ ...cfg, ...data }} onBack={() => setActiveView(null)} />;
  }

  if (activeView && !activeView.startsWith("combo_")) {
    const category = categories.find((c) => c.id === activeView);
    return <FoodList category={category} bosses={bosses} allItems={allItems} onBack={() => setActiveView(null)} />;
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
          Synced from <span style={{ color: "#d4aa60" }}>Bosses</span> tab
        </div>
      </div>

      <div className="grid-label">✦ Best meal combos for your zone</div>
      <div className="responsive-grid" style={{ marginBottom: 28 }}>
        {combos ? [
          { id: "combo_health", emoji: "❤️", label: "Max Health", color: "#c04a4a", key: "health" },
          { id: "combo_stamina", emoji: "⚡", label: "Max Stamina", color: "#4a8acc", key: "stamina" },
          { id: "combo_avg", emoji: "⚖️", label: "Best Balance", color: "#8aaa4a", key: "avg" },
          { id: "combo_eitr", emoji: "🔮", label: "Max Eitr", color: "#8a2be2", key: "eitr" },
        ].map((cfg) => {
          const combo = combos[cfg.key];
          const isEitrLocked = cfg.id === "combo_eitr" && !yagluthDefeated;
          return (
            <div key={cfg.id} onClick={() => setActiveView(cfg.id)}
              className="combo-card" style={{ border: `1px solid ${cfg.color}44`, opacity: isEitrLocked ? 0.7 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${cfg.color}44`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="combo-header">
                <span className="combo-header-emoji">{cfg.emoji}</span>
                <div>
                  <div className="combo-header-title" style={{ color: cfg.color }}>{cfg.label.toUpperCase()}</div>
                  {isEitrLocked ? (
                    <div className="combo-stat-badge" style={{ color: "#aa88c8" }}>🔒 Defeat Yagluth to unlock</div>
                  ) : (
                    <div className="combo-stat-badges">
                      <div className="combo-stat-badge" style={{ color: "#e06a6a" }}>❤️ {combo.totalH}</div>
                      <div className="combo-stat-badge" style={{ color: "#6aaaee" }}>⚡ {combo.totalS}</div>
                      {combo.totalE > 0 && <div className="combo-stat-badge" style={{ color: "#aa6aee" }}>🔮 {combo.totalE}</div>}
                    </div>
                  )}
                </div>
              </div>
              {!isEitrLocked && (
                <div className="combo-foods-list">
                  {(combo.foods || []).map((food, i) => (
                    <div key={i} className="combo-food-item" style={{ color: "#6a7a5a" }}><span style={{ color: cfg.color, fontSize: 10 }}>●</span>{food.name}</div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{ gridColumn: "1/-1", fontFamily: "'Crimson Text',serif", fontSize: 13, color: "#3a4a3a", fontStyle: "italic", padding: "12px 0" }}>
            Defeat Yagluth to unlock combo recommendations!
          </div>
        )}
      </div>

      <div className="grid-label">Browse by category</div>
      <div className="responsive-grid" style={{ gap: 14 }}>
        {categories.map((category) => {
          const catItems = allItems.filter((item) => ["Consumable", "Fish"].includes(item.type) && (item.foodCategory || "potion") === category.id);
          const available = catItems.filter((item) => !item.biome || item.biome === "Unknown" || (BIOME_TIER[item.biome] || 0) <= currentTier);
          const bestItem = category.best ? category.best([...available]) : null;
          return (
            <div key={category.id} onClick={() => setActiveView(category.id)}
              className="category-card"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = category.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2f2a"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="food-info-header">
                <span className="food-info-emoji">{category.emoji}</span>
                <div>
                  <div className="combo-header-title" style={{ color: category.color }}>{category.label.toUpperCase()}</div>
                  <div className="food-info-meta">{catItems.length} items · {available.length} available</div>
                </div>
              </div>
              <p className="food-description" style={{ marginBottom: 14 }}>{category.desc}</p>
              {bestItem ? (
                <div className="food-info-block">
                  <div className="food-info-block-title">✦ Best available</div>
                  <div className="food-info-block-item">{bestItem.name}</div>
                  {bestItem.biome && bestItem.biome !== "Unknown" && <div className="food-info-block-biome" style={{ color: BIOME_COLORS[bestItem.biome] }}>{BIOME_ICONS[bestItem.biome]} {bestItem.biome}</div>}
                </div>
              ) : (
                <div className="food-unavailable">🔒 None available yet</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
