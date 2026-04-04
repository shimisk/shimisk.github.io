/**
 * grouping.js
 *
 * Groups articles that likely refer to the same story.
 *
 * ALGORITHM:
 *  1. Extract "significant" keywords from each article title.
 *  2. Build an inverted index: keyword → [articleIds]
 *  3. Two articles are connected if they share ≥ MIN_SHARED_KEYWORDS keywords.
 *  4. Use Union-Find to merge connected articles into clusters.
 *  5. Each cluster becomes a StoryGroup.
 *
 * StoryGroup shape:
 * {
 *   id:           string
 *   articles:     Article[]
 *   outletIds:    string[]   (outlets that DID cover this story)
 *   missingIds:   string[]   (outlets that did NOT cover this story)
 *   topKeywords:  string[]
 *   publishedAt:  Date | null  (most recent article date)
 *   representative: Article   (most recent or first article)
 * }
 */

import { getBias } from './bias.js'

// ─── Stopwords ───────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'as','is','it','its','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'can','not','no','so','if','by','from','up','about','into','than','then',
  'that','this','these','those','their','they','them','there','what','which',
  'who','whom','how','when','where','why','all','any','both','each','few',
  'more','most','other','some','such','too','very','just','over','also',
  'after','before','between','during','through','within','without','against',
  'he','she','we','you','i','me','my','his','her','our','your','its','us',
  'says','said','say','new','new','s','re','ve','ll','d','t','m',
])

const MIN_WORD_LENGTH = 3
const MAX_TITLE_KEYWORDS = 18
const MAX_DESC_KEYWORDS = 20
const MAX_URL_KEYWORDS = 10
const MAX_BIGRAMS = 10

const MIN_SHARED_TITLE_TERMS = 2
const MIN_JACCARD_SIMILARITY = 0.2
const MIN_WEIGHTED_SCORE = 3.8
const MIN_GROUPS_TARGET = 10

function getBiasSides(outletIds) {
  let leftCount = 0
  let rightCount = 0
  let centerCount = 0

  outletIds.forEach((id) => {
    const bias = getBias(id)
    if (bias === 'left' || bias === 'center-left') leftCount++
    else if (bias === 'right' || bias === 'center-right') rightCount++
    else if (bias === 'center') centerCount++
  })

  return { leftCount, rightCount, centerCount }
}

function computeContrastRank(group) {
  const { leftCount, rightCount, centerCount } = getBiasSides(group.outletIds)
  const sourceCount = group.outletIds.length
  const hasBothSides = leftCount > 0 && rightCount > 0

  // Heavily reward true left/right contrast and broader source coverage.
  const sideBalance = hasBothSides
    ? 1 - Math.abs(leftCount - rightCount) / (leftCount + rightCount)
    : 0

  return (
    (hasBothSides ? 6 : 0) +
    sourceCount * 0.8 +
    sideBalance * 3 +
    Math.min(centerCount, 2) * 0.5
  )
}

// ─── Keyword extraction ───────────────────────────────────────────────────────

function stemWord(word) {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function extractKeywords(text, max = MAX_TITLE_KEYWORDS) {
  return text
    .toLowerCase()
    .replace(/['']/g, '') // smart quotes
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .map(stemWord)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !STOPWORDS.has(w))
    .slice(0, max)
}

function extractUrlKeywords(url) {
  try {
    const parsed = new URL(url)
    return extractKeywords(parsed.pathname.replace(/[-_/]/g, ' '), MAX_URL_KEYWORDS)
  } catch {
    return []
  }
}

function toBigrams(tokens) {
  const out = []
  for (let i = 0; i < tokens.length - 1 && out.length < MAX_BIGRAMS; i++) {
    out.push(`${tokens[i]}_${tokens[i + 1]}`)
  }
  return out
}

function intersectCount(aSet, bSet) {
  let count = 0
  for (const value of aSet) {
    if (bSet.has(value)) count++
  }
  return count
}

function jaccardSimilarity(aSet, bSet) {
  if (!aSet.size || !bSet.size) return 0
  const intersection = intersectCount(aSet, bSet)
  const union = aSet.size + bSet.size - intersection
  return union ? intersection / union : 0
}

function buildArticleFeatures(article) {
  const titleTerms = extractKeywords(article.title ?? '', MAX_TITLE_KEYWORDS)
  const descTerms = extractKeywords(article.description ?? '', MAX_DESC_KEYWORDS)
  const urlTerms = extractUrlKeywords(article.url ?? '')
  const titleBigrams = toBigrams(titleTerms)

  const titleTermSet = new Set(titleTerms)
  const phraseSet = new Set(titleBigrams)

  // Keep title terms strongest, then enrich with description/URL hints.
  const tokenSet = new Set([...titleTerms, ...titleBigrams, ...descTerms, ...urlTerms])

  return {
    titleTerms,
    descTerms,
    urlTerms,
    titleTermSet,
    phraseSet,
    tokenSet,
  }
}

function shouldGroup(featuresA, featuresB) {
  const sharedTitle = intersectCount(featuresA.titleTermSet, featuresB.titleTermSet)
  const sharedPhrases = intersectCount(featuresA.phraseSet, featuresB.phraseSet)
  const similarity = jaccardSimilarity(featuresA.tokenSet, featuresB.tokenSet)

  const weightedScore =
    sharedTitle * 1.2 +
    sharedPhrases * 2.1 +
    similarity * 4

  if (sharedPhrases >= 1 && similarity >= 0.17) return true
  if (sharedTitle >= MIN_SHARED_TITLE_TERMS && similarity >= MIN_JACCARD_SIMILARITY) return true
  return weightedScore >= MIN_WEIGHTED_SCORE
}

// ─── Union-Find ───────────────────────────────────────────────────────────────

function makeUnionFind(n) {
  const parent = Array.from({ length: n }, (_, i) => i)
  const rank = new Array(n).fill(0)

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x])
    return parent[x]
  }

  function union(x, y) {
    const px = find(x), py = find(y)
    if (px === py) return
    if (rank[px] < rank[py]) { parent[px] = py }
    else if (rank[px] > rank[py]) { parent[py] = px }
    else { parent[py] = px; rank[px]++ }
  }

  return { find, union }
}

// ─── Main grouping function ───────────────────────────────────────────────────

/**
 * @param {Article[]} articles
 * @param {string[]} allOutletIds - complete list of tracked outlet ids
 * @returns {StoryGroup[]}
 */
export function groupArticles(articles, allOutletIds) {
  if (!articles.length) return []

  // 1. Build lexical features for each article.
  const features = articles.map((a) => buildArticleFeatures(a))
  articles.forEach((a, idx) => {
    a.keywords = features[idx].titleTerms
  })

  // 2. Build inverted index (title terms + title phrases) for candidate pairing.
  const invertedIndex = new Map() // feature → Set of article indices
  features.forEach((f, idx) => {
    const indexTerms = [...f.titleTermSet, ...f.phraseSet]
    indexTerms.forEach((kw) => {
      if (!invertedIndex.has(kw)) invertedIndex.set(kw, new Set())
      invertedIndex.get(kw).add(idx)
    })
  })

  // 3. Evaluate only candidate pairs that share at least one indexed feature.
  const uf = makeUnionFind(articles.length)
  const candidatePairs = new Set()

  invertedIndex.forEach((indexSet) => {
    if (indexSet.size < 2) return
    const idxArr = Array.from(indexSet)
    for (let i = 0; i < idxArr.length; i++) {
      for (let j = i + 1; j < idxArr.length; j++) {
        const a = idxArr[i]
        const b = idxArr[j]
        candidatePairs.add(a < b ? `${a}|${b}` : `${b}|${a}`)
      }
    }
  })

  candidatePairs.forEach((pairKey) => {
    const [aStr, bStr] = pairKey.split('|')
    const a = Number.parseInt(aStr, 10)
    const b = Number.parseInt(bStr, 10)
    if (Number.isNaN(a) || Number.isNaN(b)) return

    if (shouldGroup(features[a], features[b])) {
      uf.union(a, b)
    }
  })

  // 4. Build clusters
  const clusters = new Map() // root → article[]
  articles.forEach((article, idx) => {
    const root = uf.find(idx)
    if (!clusters.has(root)) clusters.set(root, [])
    clusters.get(root).push(article)
  })

  // 5. Convert to StoryGroup objects
  const groups = []
  let gid = 0

  clusters.forEach((clusterArticles) => {
    // Sort by most recent first
    clusterArticles.sort((a, b) => {
      if (!a.publishedAt) return 1
      if (!b.publishedAt) return -1
      return b.publishedAt - a.publishedAt
    })

    const representative = clusterArticles[0]

    // Deduplicate by outlet (keep newest per outlet)
    const seenOutlets = new Set()
    const dedupedArticles = clusterArticles.filter((a) => {
      if (seenOutlets.has(a.outletId)) return false
      seenOutlets.add(a.outletId)
      return true
    })

    const outletIds = [...new Set(dedupedArticles.map((a) => a.outletId))]
    const missingIds = allOutletIds.filter((id) => !outletIds.includes(id))

    // Top keywords = most frequent across all articles in group
    const kwFreq = new Map()
    clusterArticles.forEach((a) =>
      a.keywords.forEach((kw) => kwFreq.set(kw, (kwFreq.get(kw) ?? 0) + 1))
    )
    const topKeywords = [...kwFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw)

    groups.push({
      id: `sg-${gid++}`,
      articles: dedupedArticles,
      outletIds,
      missingIds,
      topKeywords,
      publishedAt: representative.publishedAt,
      representative,
      size: clusterArticles.length,
    })
  })

  // Sort groups by most recent story first
  const ranked = groups
    .map((group) => ({
      group,
      rank: computeContrastRank(group),
      sourceCount: group.outletIds.length,
    }))
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount
      if (!a.group.publishedAt) return 1
      if (!b.group.publishedAt) return -1
      return b.group.publishedAt - a.group.publishedAt
    })

  const multiSource = ranked.filter((entry) => entry.sourceCount >= 2)
  const singleSource = ranked.filter((entry) => entry.sourceCount < 2)

  // Prefer multi-source comparison stories; include singles only as fallback.
  const finalOrdered =
    multiSource.length >= MIN_GROUPS_TARGET
      ? multiSource
      : [...multiSource, ...singleSource.slice(0, Math.max(0, MIN_GROUPS_TARGET - multiSource.length))]

  return finalOrdered.map((entry) => entry.group)
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

export function filterGroups(groups, { biasFilter, outletFilter, searchQuery }) {
  return groups.filter((group) => {
    // Bias filter: group must have at least one article from a matching-bias outlet
    if (biasFilter && biasFilter !== 'all') {
      // This import is done dynamically to avoid circular deps
      const { OUTLET_MAP } = window.__parallaxConfig ?? {}
      if (OUTLET_MAP) {
        const hasBias = group.outletIds.some(
          (id) => OUTLET_MAP[id]?.bias === biasFilter
        )
        if (!hasBias) return false
      }
    }

    // Outlet filter
    if (outletFilter && outletFilter !== 'all') {
      if (!group.outletIds.includes(outletFilter)) return false
    }

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = group.representative.title.toLowerCase().includes(q)
      const matchesKeyword = group.topKeywords.some((kw) => kw.includes(q))
      if (!matchesTitle && !matchesKeyword) return false
    }

    return true
  })
}
