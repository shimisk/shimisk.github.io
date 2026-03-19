import { useState } from "react";
import { BIOME_COLORS, BIOME_ICONS } from "../../constants.jsx";

const HILDIR_CHESTS = [
  {
    id: "return_brass_chest",
    name: "Brass Chest",
    icon: "🟡",
    color: "#c4944a",
    location: "Smouldering Tombs — Black Forest dungeon",
    boss: "Defeat Brenna (Fire Skeleton boss) inside",
    desc: "A burning Black Forest dungeon. Brenna wields fire — bring fire resist mead and a strong shield.",
  },
  {
    id: "return_silver_chest",
    name: "Silver Chest",
    icon: "⚪",
    color: "#a8c4d4",
    location: "Howling Caverns — Mountain dungeon",
    boss: "Defeat Geirrhafa (Fenring boss) inside",
    desc: "A frozen Mountain cave. Geirrhafa is a powerful Fenring — bring frost resist and blunt weapons.",
  },
  {
    id: "return_bronze_chest",
    name: "Bronze Chest",
    icon: "🟤",
    color: "#8a6a3a",
    location: "Sealed Tower — Plains dungeon",
    boss: "Defeat Zil (Dvergr Ghost boss) inside",
    desc: "A sealed Dvergr tower in the Plains. Zil is an elemental ghost — bring elemental resistance.",
  },
];

function VendorDetail({ vendor, bosses, hildirChests, setHildirChests, onBack }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleChest = (id) => setHildirChests((prev) => ({ ...prev, [id]: !prev[id] }));
  const BOSS_MAP = { defeat_elder: 2, defeat_bonemass: 3, defeat_moder: 4, defeat_yagluth: 5, defeat_queen: 6, defeat_fader: 7 };

  const isUnlocked = (req) => {
    if (!req) return true;
    if (req.startsWith("return_")) return hildirChests[req] ? true : false;
    const bossId = BOSS_MAP[req];
    if (!bossId) return true;
    return bosses.find((b) => b.id === bossId)?.defeated || false;
  };

  const isHildir = vendor.id === "hildir";

  return (
    <div>
      <div className="panel-head-row material-list-head">
        <button className="panel-back-btn" onClick={onBack}>← Back</button>
        <div>
          <h2 className="panel-title" style={{ color: vendor.color }}>{vendor.icon} {vendor.name}</h2>
          <p className="panel-subtitle">{vendor.title}</p>
        </div>
      </div>

      <div className="vendor-location-box">
        <div className="vendor-location-label">📍 Location</div>
        <div className="vendor-location-text">{vendor.location}</div>
        <div className="vendor-location-tip">💡 {vendor.tip}</div>
      </div>

      {isHildir && (
        <div className="vendor-chests-section">
          <div className="vendor-chests-label">📜 Returned chests — click to mark</div>
          <div className="vendor-chests-container">
            {HILDIR_CHESTS.map((chest) => {
              const done = hildirChests[chest.id];
              const itemsUnlocked = vendor.sells.filter((item) => item.unlockRequirement === chest.id);
              return (
                <div key={chest.id} onClick={() => toggleChest(chest.id)}
                  className={`vendor-chest-card ${done ? 'done' : 'not-done'}`}
                  style={{ borderColor: done ? chest.color : "#2a2a2a" }}>
                  <div className="vendor-chest-icon">🧳</div>
                  <div className="vendor-chest-name" style={{ color: done ? chest.color : "#7a6a5a" }}>{chest.name}</div>
                  <div className="vendor-chest-count" style={{ color: done ? "#8acc6a" : "#4a4a3a" }}>
                    {itemsUnlocked.length} item{itemsUnlocked.length !== 1 ? "s" : ""}
                  </div>
                  <div className="vendor-chest-toggle" style={{ borderColor: done ? chest.color : "#3a3a3a", color: done ? chest.color : "#3a3a3a" }}>{done ? "✓" : "○"}</div>
                </div>
              );
            })}
          </div>
          <p className="vendor-chest-warning">⚠ Chests cannot be teleported — carry them back by boat</p>
        </div>
      )}

      <div className="vendor-buys-section">
        <div className="vendor-buys-label">💰 They buy (sell these for coins)</div>
        <div className="vendor-buys-container">
          {vendor.buys.map((buy, i) => (
            <div key={i} className="vendor-buy-item">
              <span className="vendor-buy-name">{buy.name}</span>
              <span className="vendor-buy-price">→ {buy.price} 🪙</span>
            </div>
          ))}
        </div>
      </div>

      <div className="vendor-sells-label">🛒 For sale</div>
      <div className="vendor-sells-container">
        {vendor.sells.map((item, i) => {
          const unlocked = isUnlocked(item.unlockRequirement);
          const isChestGated = item.unlockRequirement?.startsWith("return_");
          const chestInfo = isChestGated ? HILDIR_CHESTS.find((chest) => chest.id === item.unlockRequirement) : null;

          return (
            <div key={i} onClick={() => setSelectedItem(selectedItem === i ? null : i)}
              className={`vendor-sell-item ${selectedItem === i ? 'selected' : 'unlocked'}`}
              style={{ borderColor: selectedItem === i ? vendor.color : unlocked ? "#1e2320" : "#1a1a1a", opacity: unlocked ? 1 : 0.4 }}>
              <div className="vendor-sell-header">
                <div className="vendor-sell-info">
                  <div className="vendor-sell-name-row">
                    <span className={`vendor-sell-name ${unlocked ? 'unlocked' : 'locked'}`}>{item.name}</span>
                    {!unlocked && isChestGated && chestInfo && <span className="vendor-sell-lock-badge chest" style={{ borderColor: `${chestInfo.color}44`, color: `${chestInfo.color}99` }}>🔒 {chestInfo.icon} {chestInfo.name}</span>}
                    {!unlocked && !isChestGated && <span className="vendor-sell-lock-badge locked">🔒 LOCKED</span>}
                  </div>
                  <div className="vendor-sell-use">{item.use}</div>
                </div>
                <div className="vendor-sell-price-box">
                  <div className={`vendor-sell-price ${unlocked ? 'unlocked' : 'locked'}`}>{item.price}</div>
                  <div className="vendor-sell-price-label">🪙 coins</div>
                </div>
                <span className="vendor-sell-chevron" style={{ color: selectedItem === i ? vendor.color : "#3a3a2a" }}>{selectedItem === i ? "▲" : "▼"}</span>
              </div>

              {selectedItem === i && (
                <div className="vendor-sell-detail">
                  <p className="vendor-sell-desc">{item.desc}</p>
                  {!unlocked && item.unlockTip && (
                    <div className={`vendor-sell-lock-tip ${isChestGated ? 'chest' : ''}`}>
                      <div className="vendor-sell-lock-tip-label">{isChestGated ? "📜 How to unlock" : "🔒 How to unlock"}</div>
                      <div className="vendor-sell-lock-tip-text">{item.unlockTip}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VendorsPanel({ vendors, bosses, hildirChests, setHildirChests }) {
  const [activeVendor, setActiveVendor] = useState(null);

  if (activeVendor) {
    const vendor = vendors.find((v) => v.id === activeVendor);
    return <VendorDetail vendor={vendor} bosses={bosses} hildirChests={hildirChests} setHildirChests={setHildirChests} onBack={() => setActiveVendor(null)} />;
  }

  return (
    <div>
      <p className="panel-subtitle vendor-intro">
        Three merchants roam Valheim — find them, build a portal, and get rich
      </p>

      <div className="vendor-grid">
        {vendors.map((vendor) => {
          const bossMap = { defeat_elder: 2, defeat_bonemass: 3, defeat_moder: 4, defeat_yagluth: 5, defeat_queen: 6, defeat_fader: 7 };
          const availableCount = vendor.sells.filter((item) => {
            if (!item.unlockRequirement) return true;
            if (item.unlockRequirement.startsWith("return_")) return false;
            const bossId = bossMap[item.unlockRequirement];
            return !bossId || bosses.find((boss) => boss.id === bossId)?.defeated;
          }).length;
          const lockedCount = vendor.sells.length - availableCount;

          return (
            <div key={vendor.id} onClick={() => setActiveVendor(vendor.id)}
              className="vendor-card" style={{ border: `1px solid ${vendor.color}44` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = vendor.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${vendor.color}44`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

              <div className="vendor-card-header">
                <span className="vendor-card-icon">{vendor.icon}</span>
                <div className="vendor-card-info">
                  <div className="vendor-card-title" style={{ color: vendor.color }}>{vendor.name.toUpperCase()}</div>
                  <div className="vendor-card-subtitle">{vendor.title}</div>
                </div>
              </div>

              <div className="vendor-card-biome-row">
                <span className="vendor-card-biome-icon">{BIOME_ICONS[vendor.biome]}</span>
                <span className="vendor-card-biome-name" style={{ color: BIOME_COLORS[vendor.biome] }}>{vendor.biome}</span>
                <span className="vendor-card-biome-map">— {vendor.mapIcon}</span>
              </div>

              <div className="vendor-card-counts">
                <div className="vendor-card-count vendor-card-count-available">
                  <div className="vendor-card-count-number">{availableCount}</div>
                  <div className="vendor-card-count-label">available</div>
                </div>
                {lockedCount > 0 && (
                  <div className="vendor-card-count vendor-card-count-locked">
                    <div className="vendor-card-count-number">{lockedCount}</div>
                    <div className="vendor-card-count-label">locked</div>
                  </div>
                )}
              </div>

              <div className="vendor-card-location">
                {vendor.location.split(".")[0]}.
              </div>
            </div>
          );
        })}
      </div>

      <div className="vendor-universal-buys">
        <div className="vendor-universal-label">💰 What all vendors buy from you</div>
        <div className="vendor-universal-container">
          {[["Amber", "5"], ["Amber Pearl", "10"], ["Ruby", "20"], ["Silver Necklace", "30"]].map(([name, price]) => (
            <div key={name} className="vendor-universal-item">
              <div className="vendor-universal-name">{name}</div>
              <div className="vendor-universal-price">{price} 🪙 coins</div>
            </div>
          ))}
        </div>
        <p className="vendor-universal-note">Sell to any vendor — prices are the same across all three</p>
      </div>
    </div>
  );
}
