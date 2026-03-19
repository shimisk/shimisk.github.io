import { BIOME_COLORS, BIOME_ICONS } from "../../constants.jsx";

const FARMING_CROPS = [
  {
    id: "carrot",
    name: "Carrot",
    icon: "🥕",
    biome: "Black Forest",
    plantBiome: "Meadows, Black Forest, Plains",
    growTime: "~50 minutes",
  },
  {
    id: "turnip",
    name: "Turnip",
    icon: "🌱",
    biome: "Swamp",
    plantBiome: "Meadows, Black Forest, Plains",
    growTime: "~50 minutes",
  },
  {
    id: "onion",
    name: "Onion",
    icon: "🧅",
    biome: "Mountain",
    plantBiome: "Meadows, Black Forest, Plains",
    growTime: "~50 minutes",
  },
  {
    id: "barley",
    name: "Barley",
    icon: "🌾",
    biome: "Plains",
    plantBiome: "Plains",
    growTime: "~50 minutes",
  },
  {
    id: "flax",
    name: "Flax",
    icon: "🌿",
    biome: "Plains",
    plantBiome: "Plains",
    growTime: "~50 minutes",
  },
  {
    id: "jotun-puffs",
    name: "Jotun Puffs",
    icon: "🍄",
    biome: "Mistlands",
    plantBiome: "Mistlands",
    growTime: "~60 minutes",
  },
  {
    id: "magecap",
    name: "Magecap",
    icon: "🍄",
    biome: "Mistlands",
    plantBiome: "Mistlands",
    growTime: "~60 minutes",
  },
];

export function FarmingPanel() {
  return (
    <div>
      <p className="panel-subtitle farming-intro">
        Farming quick reference: crop name, where it can be planted, and approximate grow time.
      </p>

      <div className="farming-grid">
        {FARMING_CROPS.map((crop) => (
          <div key={crop.id} className="farming-card panel-overview-card" style={{ border: `1px solid ${(BIOME_COLORS[crop.biome] || "#8a7a5a")}44` }}>
            <div className="farming-card-header">
              <span className="farming-card-icon">{crop.icon}</span>
              <div>
                <div className="farming-card-title">{crop.name.toUpperCase()}</div>
                <div className="farming-card-biome" style={{ color: BIOME_COLORS[crop.biome] || "#8a7a5a" }}>
                  {BIOME_ICONS[crop.biome] || "🗺"} {crop.biome}
                </div>
              </div>
            </div>

            <div className="farming-card-meta farming-time-row">
              <div className="farming-meta-label">Can Be Planted In</div>
              <div className="farming-meta-value" style={{ marginBottom: 8 }}>
                {BIOME_ICONS[crop.plantBiome] || "🗺"} {crop.plantBiome}
              </div>
              <div className="farming-meta-label">Grow Time</div>
              <div className="farming-meta-value">{crop.growTime}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
