import { BIOME_COLORS, BIOME_ICONS } from "../../constants.jsx";

const TAMING_CREATURES = [
  {
    id: "boar",
    name: "Boar",
    icon: "🐗",
    biome: "Meadows",
    food: "Raspberries, Blueberries, Carrots, Turnips, Onions, Mushrooms",
    tameTime: "30 minutes",
  },
  {
    id: "wolf",
    name: "Wolf",
    icon: "🐺",
    biome: "Mountain",
    food: "Raw meat (Boar, Deer, Neck, Lox, Hare, Chicken)",
    tameTime: "30 minutes",
  },
  {
    id: "lox",
    name: "Lox",
    icon: "🦬",
    biome: "Plains",
    food: "Cloudberries, Barley, Flax",
    tameTime: "30 minutes",
  },
  {
    id: "asksvin",
    name: "Asksvin",
    icon: "🦎",
    biome: "Ashlands",
    food: "Vineberries",
    tameTime: "30 minutes",
  },
  {
    id: "chicken",
    name: "Chicken",
    icon: "🐔",
    biome: "Meadows",
    food: "Seeds, Dandelion, Barley",
    tameTime: "Already tame (hatched from Egg)",
  },
];

export function TamingPanel() {
  return (
    <div>
      <p className="panel-subtitle taming-intro">
        Taming quick reference: creature, biome, preferred food, and base tame duration.
      </p>

      <div className="taming-grid">
        {TAMING_CREATURES.map((creature) => (
          <div key={creature.id} className="taming-card panel-overview-card" style={{ border: `1px solid ${BIOME_COLORS[creature.biome]}44` }}>
            <div className="taming-card-header">
              <span className="taming-card-icon">{creature.icon}</span>
              <div>
                <div className="taming-card-title">{creature.name.toUpperCase()}</div>
                <div className="taming-card-biome" style={{ color: BIOME_COLORS[creature.biome] }}>
                  {BIOME_ICONS[creature.biome]} {creature.biome}
                </div>
              </div>
            </div>

            <div className="taming-card-meta">
              <div className="taming-meta-label">What They Eat</div>
              <div className="taming-meta-value">{creature.food}</div>
            </div>

            <div className="taming-card-meta taming-time-row">
              <div className="taming-meta-label">Time To Tame</div>
              <div className="taming-meta-value">{creature.tameTime}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
