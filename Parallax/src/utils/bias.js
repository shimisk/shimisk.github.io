/**
 * bias.js
 *
 * Bias rating logic.
 *
 * Currently implemented as a pure lookup against the static OUTLET_MAP.
 * This module is intentionally thin and separated so it can be extended
 * later — e.g., to fetch from an external free bias API, or to allow
 * users to override ratings.
 *
 * To extend: add a new resolver to the RESOLVERS array. Each resolver
 * receives an outletId and returns a bias string or null. The first
 * non-null result wins.
 */

import { OUTLET_MAP, BIAS_META } from '../config/sources.config.js'

// ─── Resolvers ────────────────────────────────────────────────────────────────

const staticResolver = (outletId) => OUTLET_MAP[outletId]?.bias ?? null

// Add more resolvers here in priority order, e.g.:
// const userOverrideResolver = (outletId) => localStorage.getItem(`bias:${outletId}`) ?? null
const RESOLVERS = [
  // userOverrideResolver,  // uncomment when implemented
  staticResolver,
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the bias category string for an outlet id.
 * Falls back to 'unknown' if none of the resolvers return a value.
 */
export function getBias(outletId) {
  for (const resolver of RESOLVERS) {
    const result = resolver(outletId)
    if (result) return result
  }
  return 'unknown'
}

/**
 * Returns the full BIAS_META entry for a bias category string.
 */
export function getBiasMeta(biasCategory) {
  return BIAS_META[biasCategory] ?? BIAS_META.unknown
}

/**
 * Returns the bias meta for an outlet id directly.
 */
export function getOutletBiasMeta(outletId) {
  return getBiasMeta(getBias(outletId))
}

/**
 * Compute the bias distribution across a set of outlet ids.
 * Returns an object: { left: n, 'center-left': n, center: n, ... }
 */
export function computeBiasDistribution(outletIds) {
  const dist = {}
  outletIds.forEach((id) => {
    const bias = getBias(id)
    dist[bias] = (dist[bias] ?? 0) + 1
  })
  return dist
}

/**
 * Returns a "bias balance score" for a story group:
 * - 1.0  → perfectly balanced across left/center/right
 * - 0.0  → only one side represented
 * Used for visual indicators.
 */
export function computeBalanceScore(outletIds) {
  if (!outletIds.length) return 0
  const dist = computeBiasDistribution(outletIds)
  const leftCount = (dist.left ?? 0) + (dist['center-left'] ?? 0)
  const rightCount = (dist.right ?? 0) + (dist['center-right'] ?? 0)
  const centerCount = dist.center ?? 0
  const total = leftCount + rightCount + centerCount
  if (total === 0) return 0
  // Normalize so max diversity = 1
  const lRatio = leftCount / total
  const rRatio = rightCount / total
  const cRatio = centerCount / total
  // Shannon entropy-inspired: penalize imbalance
  return 1 - Math.abs(lRatio - rRatio) - Math.max(0, 0.5 - cRatio)
}
