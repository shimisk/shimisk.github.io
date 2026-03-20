export const STYLE_COLORS = { warrior: "#c4944a", rogue: "#4a9a8a", berserker: "#c44a4a", mage: "#7a6b8a", ranger: "#4a9a6a" };
export const STYLE_ICONS = { warrior: "⚔️", rogue: "🗡", berserker: "💢", mage: "🔮", ranger: "🏹" };

export const BOSS_BIOME_SEQUENCE = ["Meadows", "Black Forest", "Swamp", "Mountain", "Plains", "Mistlands", "Ashlands"];

export const BIOME_TIER = { Meadows: 1, "Black Forest": 2, Swamp: 3, Mountain: 4, Plains: 5, Ocean: 3, Mistlands: 6, Ashlands: 7, Unknown: 0 };
export const BIOME_COLORS = { Meadows: "#7db87d", "Black Forest": "#4a7c59", Swamp: "#6b7c5a", Mountain: "#a8c4d4", Plains: "#d4b87a", Ocean: "#4a8fa8", Mistlands: "#7a6b8a", Ashlands: "#c4604a", Unknown: "#4a4a4a" };
export const BIOME_ICONS = { Meadows: "🌿", "Black Forest": "🌲", Swamp: "🐸", Mountain: "🏔", Plains: "🌾", Ocean: "🌊", Mistlands: "🌫", Ashlands: "🌋" };

export function getCurrentBiome(bosses) {
  const defeated = bosses.filter((b) => b.defeated).sort((a, b) => b.id - a.id);
  if (defeated.length === 0) return "Meadows";
  const idx = BOSS_BIOME_SEQUENCE.indexOf(defeated[0].biome);
  return BOSS_BIOME_SEQUENCE[Math.min(idx + 1, BOSS_BIOME_SEQUENCE.length - 1)];
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeWeaponCategoryMatcher(cat) {
  const includePattern = (cat.match_keywords || []).filter(Boolean).map(escapeRegExp).join("|");
  const excludePattern = (cat.exclude || []).filter(Boolean).map(escapeRegExp).join("|");
  const includeRe = includePattern ? new RegExp(includePattern, "i") : null;
  const excludeRe = excludePattern ? new RegExp(excludePattern, "i") : null;
  const allowedTypes = Array.isArray(cat.types) ? cat.types : [];

  return (weapon) => {
    if (allowedTypes.length && !allowedTypes.includes(weapon.type)) return false;
    if (excludeRe && excludeRe.test(weapon.name)) return false;
    if (!includeRe) return true;
    return includeRe.test(weapon.name);
  };
}

export function buildWeaponCategories(categorySource) {
  const source = Array.isArray(categorySource) ? categorySource : [];
  return source.map((cat) => ({
    ...cat,
    match: makeWeaponCategoryMatcher(cat),
  }));
}

const FOOD_CATEGORY_TRANSFORMS = {
  health: {
    primaryStat: "health",
    secondaryStat: "stamina",
    sortKey: (item) => -(item.health || 0),
    best: (items) => items.sort((a, b) => (b.health || 0) - (a.health || 0))[0],
  },
  stamina: {
    primaryStat: "stamina",
    secondaryStat: "health",
    sortKey: (item) => -(item.stamina || 0),
    best: (items) => items.sort((a, b) => (b.stamina || 0) - (a.stamina || 0))[0],
  },
  neutral: {
    primaryStat: "health",
    secondaryStat: "stamina",
    sortKey: (item) => -((item.health || 0) + (item.stamina || 0)),
    best: (items) => items.sort((a, b) => ((b.health || 0) + (b.stamina || 0)) - ((a.health || 0) + (a.stamina || 0)))[0],
  },
  eitr: {
    primaryStat: "eitr",
    secondaryStat: "health",
    sortKey: (item) => -(item.eitr || 0),
    best: (items) => items.sort((a, b) => (b.eitr || 0) - (a.eitr || 0))[0],
  },
  potion: {
    primaryStat: null,
    secondaryStat: null,
    sortKey: () => 0,
    best: (items) => items[0],
  },
};

export function buildFoodCategories(categorySource) {
  const source = Array.isArray(categorySource) ? categorySource : [];
  return source.map((cat) => ({
    ...cat,
    ...(FOOD_CATEGORY_TRANSFORMS[cat.id] || {}),
  }));
}
