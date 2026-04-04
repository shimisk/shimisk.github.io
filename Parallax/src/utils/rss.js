/**
 * rss.js
 *
 * Fetches RSS feeds through the allorigins.win CORS proxy, parses XML,
 * and normalises each entry into the canonical Article shape.
 *
 * Canonical Article shape:
 * {
 *   id:          string   (hash of url)
 *   url:         string
 *   title:       string
 *   description: string
 *   imageUrl:    string | null
 *   publishedAt: Date | null
 *   outletId:    string
 *   feedUrl:     string
 *   keywords:    string[]  (derived, see grouping.js)
 * }
 */

import { PROXY_BASE, FEED_TO_OUTLET, DISABLED_FEEDS, OUTLET_MAP } from '../config/sources.config.js'

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url='
const TRANSLATE_BASE = 'https://api.mymemory.translated.net/get'
const LOCAL_PROXY_BASE = '/__rss_proxy?url='
const FETCH_TIMEOUT_MS = 12000
const RSS2JSON_COOLDOWN_MS = 5 * 60 * 1000
const FEED_CONCURRENCY = 6
const TRANSLATION_MAX_ARTICLES = 18
const TRANSLATION_TEXT_LIMIT = 700
const TRANSLATION_TIMEOUT_MS = 10000
const LOCAL_DIRECT_BLOCKED_HOSTS = new Set([
  'www.axios.com',
  'axios.com',
])
const RSS2JSON_BLOCKED_HOSTS = new Set([
  'www.axios.com',
  'axios.com',
])
const ALLORIGINS_RAW_BLOCKED_HOSTS = new Set([
  'apnews.com',
  'www.apnews.com',
])

let rss2jsonBlockedUntil = 0
let rss2jsonQueue = Promise.resolve()
const translationCache = new Map()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function getText(el, ...tags) {
  for (const tag of tags) {
    const node = el.querySelector(tag)
    if (node?.textContent?.trim()) return node.textContent.trim()
  }
  return ''
}

function getAttr(el, tag, attr) {
  return el.querySelector(tag)?.getAttribute(attr)?.trim() ?? null
}

function extractImage(item) {
  // Try media:content, media:thumbnail, enclosure, og:image in description
  const mediaThumbnail = item.querySelector('thumbnail')
  if (mediaThumbnail?.getAttribute('url')) return mediaThumbnail.getAttribute('url')

  const mediaContent = item.querySelector('content')
  if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url')

  const enclosure = item.querySelector('enclosure')
  if (enclosure?.getAttribute('type')?.startsWith('image')) {
    return enclosure.getAttribute('url')
  }

  // Attempt to parse first img from description HTML
  const raw = getText(item, 'description', 'summary')
  const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch) return imgMatch[1]

  return null
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function mergeSignals(primary, secondary) {
  if (!primary) return secondary
  if (!secondary) return primary

  const controller = new AbortController()
  const abort = () => controller.abort()

  if (primary.aborted || secondary.aborted) {
    controller.abort()
  } else {
    primary.addEventListener('abort', abort, { once: true })
    secondary.addEventListener('abort', abort, { once: true })
  }

  return controller.signal
}

function isLocalRuntime() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

function proxifyForLocal(url) {
  if (!isLocalRuntime()) return url
  return `${LOCAL_PROXY_BASE}${encodeURIComponent(url)}`
}

function getHost(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function shouldSkipLocalDirect(feedUrl) {
  const host = getHost(feedUrl)
  return LOCAL_DIRECT_BLOCKED_HOSTS.has(host)
}

function shouldSkipRss2Json(feedUrl) {
  const host = getHost(feedUrl)
  return RSS2JSON_BLOCKED_HOSTS.has(host)
}

function shouldSkipAllOriginsRaw(feedUrl) {
  const host = getHost(feedUrl)
  return ALLORIGINS_RAW_BLOCKED_HOSTS.has(host)
}

function enqueueRss2Json(task) {
  const run = rss2jsonQueue.then(task, task)
  rss2jsonQueue = run.catch(() => undefined)
  return run
}

function getOutletLanguage(outletId) {
  return OUTLET_MAP[outletId]?.language ?? 'en'
}

function normalizeLang(lang) {
  if (!lang) return 'en'
  return String(lang).toLowerCase().split('-')[0]
}

function truncateForTranslation(text) {
  if (!text) return ''
  const normalized = String(text).replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.slice(0, TRANSLATION_TEXT_LIMIT)
}

async function translateText(text, fromLang, signal) {
  const normalizedFrom = normalizeLang(fromLang)
  const input = truncateForTranslation(text)
  if (!input || normalizedFrom === 'en') return input

  const cacheKey = `${normalizedFrom}::${input}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  const endpoint = `${TRANSLATE_BASE}?q=${encodeURIComponent(input)}&langpair=${encodeURIComponent(`${normalizedFrom}|en`)}`
  const res = await fetchWithTimeout(proxifyForLocal(endpoint), {
    signal,
    timeoutMs: TRANSLATION_TIMEOUT_MS,
  })
  if (!res.ok) throw new Error(`Translate HTTP ${res.status}`)

  const json = await res.json()
  const translated = json?.responseData?.translatedText
  if (!translated || typeof translated !== 'string') {
    throw new Error('Invalid translation payload')
  }

  translationCache.set(cacheKey, translated)
  return translated
}

async function maybeTranslateArticles(articles, signal) {
  if (!articles.length) return articles

  const next = [...articles]
  let translatedCount = 0

  for (let i = 0; i < next.length; i++) {
    if (translatedCount >= TRANSLATION_MAX_ARTICLES) break

    const article = next[i]
    const sourceLanguage = normalizeLang(getOutletLanguage(article.outletId))
    if (sourceLanguage === 'en') continue

    try {
      const translatedTitle = await translateText(article.title, sourceLanguage, signal)
      const translatedDescription = await translateText(article.description, sourceLanguage, signal)

      const isTranslated =
        Boolean(translatedTitle && translatedTitle !== article.title) ||
        Boolean(translatedDescription && translatedDescription !== article.description)

      if (!isTranslated) continue

      next[i] = {
        ...article,
        title: translatedTitle || article.title,
        description: translatedDescription || article.description,
        isTranslated: true,
        originalLanguage: sourceLanguage,
        originalTitle: article.title,
        originalDescription: article.description,
      }
      translatedCount++
    } catch {
      // Best-effort translation: keep original text on failure.
    }
  }

  return next
}

async function fetchWithTimeout(url, { signal, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs)

  try {
    const mergedSignal = mergeSignals(signal, timeoutController.signal)
    return await fetch(url, { signal: mergedSignal })
  } catch (err) {
    const isTimeoutAbort = timeoutController.signal.aborted && !signal?.aborted
    if (isTimeoutAbort && err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function itemsFromXml(doc) {
  // RSS 2.0 uses <item>, Atom uses <entry>
  const items = Array.from(doc.querySelectorAll('item'))
  if (items.length) return items
  return Array.from(doc.querySelectorAll('entry'))
}

function normaliseItem(item, feedUrl) {
  const outletId = FEED_TO_OUTLET[feedUrl] ?? 'unknown'

  const title = stripHtml(getText(item, 'title'))
  const rawDesc = getText(item, 'description', 'summary', 'content\\:encoded', 'content')
  const description = stripHtml(rawDesc).slice(0, 320)
  const content = stripHtml(rawDesc).slice(0, 4000)

  const url =
    getText(item, 'link') ||
    getAttr(item, 'link[rel="alternate"]', 'href') ||
    getAttr(item, 'link', 'href') ||
    ''

  const publishedAt = parseDate(
    getText(item, 'pubDate', 'published', 'updated', 'dc\\:date')
  )

  const imageUrl = extractImage(item)

  return {
    id: simpleHash(url || title),
    url,
    title,
    description,
    content,
    imageUrl,
    publishedAt,
    outletId,
    feedUrl,
    keywords: [], // populated by grouping.js
  }
}

function normaliseJsonItem(item, feedUrl) {
  const outletId = FEED_TO_OUTLET[feedUrl] ?? 'unknown'

  const title = stripHtml(item?.title ?? '')
  const url = (item?.link ?? '').trim()
  const rawDesc = item?.description ?? item?.content ?? ''
  const description = stripHtml(rawDesc).slice(0, 320)
  const content = stripHtml(rawDesc).slice(0, 4000)
  const publishedAt = parseDate(item?.pubDate)
  const imageUrl =
    item?.thumbnail ||
    item?.enclosure?.link ||
    (() => {
      const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i)
      return imgMatch ? imgMatch[1] : null
    })()

  return {
    id: simpleHash(url || title),
    url,
    title,
    description,
    content,
    imageUrl,
    publishedAt,
    outletId,
    feedUrl,
    keywords: [],
  }
}

// ─── Fetch single feed ────────────────────────────────────────────────────────

async function fetchFeed(feedUrl, signal) {
  const encodedFeedUrl = encodeURIComponent(feedUrl)
  const attempts = [
    {
      name: 'local-direct',
      fetcher: async () => {
        if (!isLocalRuntime()) throw new Error('Local proxy unavailable')
        if (shouldSkipLocalDirect(feedUrl)) {
          throw new Error('Local direct disabled for this host')
        }

        const proxied = `${LOCAL_PROXY_BASE}${encodedFeedUrl}`
        const res = await fetchWithTimeout(proxied, { signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const xml = await res.text()
        if (!xml?.trim()) throw new Error('Empty local proxy payload')
        return parseXmlArticles(xml, feedUrl)
      },
    },
    {
      name: 'allorigins-get',
      fetcher: async () => {
        const proxied = proxifyForLocal(`${PROXY_BASE}${encodedFeedUrl}`)
        const res = await fetchWithTimeout(proxied, { signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        const xml = json?.contents
        if (!xml) throw new Error('Empty proxy payload')
        return parseXmlArticles(xml, feedUrl)
      },
    },
    {
      name: 'allorigins-raw',
      fetcher: async () => {
        if (shouldSkipAllOriginsRaw(feedUrl)) {
          throw new Error('allorigins raw disabled for this host')
        }

        const proxied = proxifyForLocal(`https://api.allorigins.win/raw?url=${encodedFeedUrl}`)
        const res = await fetchWithTimeout(proxied, { signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const xml = await res.text()
        if (!xml?.trim()) throw new Error('Empty raw payload')
        return parseXmlArticles(xml, feedUrl)
      },
    },
    {
      name: 'rss2json',
      fetcher: () => enqueueRss2Json(async () => {
        if (shouldSkipRss2Json(feedUrl)) {
          throw new Error('rss2json disabled for this host')
        }

        const now = Date.now()
        if (now < rss2jsonBlockedUntil) {
          const waitSec = Math.ceil((rss2jsonBlockedUntil - now) / 1000)
          throw new Error(`Temporarily paused after rate limit (${waitSec}s left)`)
        }

        const proxied = proxifyForLocal(`${RSS2JSON_BASE}${encodedFeedUrl}`)
        const res = await fetchWithTimeout(proxied, { signal })
        if (res.status === 429) {
          const retryAfter = Number.parseInt(res.headers.get('retry-after') ?? '', 10)
          const cooldownMs =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : RSS2JSON_COOLDOWN_MS
          rss2jsonBlockedUntil = Date.now() + cooldownMs
          throw new Error(`Rate limited by rss2json (429); cooling down for ${Math.ceil(cooldownMs / 1000)}s`)
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        if (json?.status !== 'ok') {
          throw new Error(json?.message || 'Bad rss2json response')
        }

        const items = Array.isArray(json?.items) ? json.items : []
        return items
          .map((item) => normaliseJsonItem(item, feedUrl))
          .filter((a) => a.title && a.url)
      }),
    },
  ]

  const errors = []
  for (const attempt of attempts) {
    try {
      const articles = await attempt.fetcher()
      if (articles.length) return articles
      errors.push(`${attempt.name}: no articles returned`)
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      errors.push(`${attempt.name}: ${err?.message ?? 'Unknown error'}`)
    }
  }

  throw new Error(`All fetch strategies failed for ${feedUrl}. ${errors.join(' | ')}`)
}

function parseXmlArticles(xml, feedUrl) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('XML parse error')

  return itemsFromXml(doc)
    .map((item) => normaliseItem(item, feedUrl))
    .filter((a) => a.title && a.url)
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function fetchBatch(allFeeds, signal) {
  const results = new Array(allFeeds.length)

  for (let i = 0; i < allFeeds.length; i += FEED_CONCURRENCY) {
    const chunk = allFeeds.slice(i, i + FEED_CONCURRENCY)
    const settled = await Promise.allSettled(
      chunk.map(({ url }) => fetchFeed(url, signal))
    )
    settled.forEach((result, offset) => {
      results[i + offset] = result
    })
  }

  const articles = []
  const errors = []

  results.forEach((result, i) => {
    const { url, outletId } = allFeeds[i]
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    } else {
      errors.push({ feedUrl: url, outletId, message: result.reason?.message ?? 'Unknown error' })
    }
  })

  const translatedArticles = await maybeTranslateArticles(articles, signal)
  return { articles: translatedArticles, errors }
}

// ─── Fetch all feeds for a set of outlets ────────────────────────────────────

/**
 * @param {import('../config/sources.config.js').OUTLETS} outlets
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ articles: Article[], errors: FeedError[] }>}
 */
export async function fetchAllFeeds(outlets, signal) {
  const allFeeds = outlets
    .flatMap((o) => o.feeds.map((url) => ({ url, outletId: o.id })))
    .filter(({ url }) => !DISABLED_FEEDS.has(url))

  if (!allFeeds.length) {
    return { articles: [], errors: [] }
  }
  const firstPass = await fetchBatch(allFeeds, signal)

  const allFailed = firstPass.articles.length === 0 && firstPass.errors.length === allFeeds.length
  if (!allFailed) return firstPass

  // Startup networks and public proxies can fail briefly; retry once before surfacing empty feed.
  await delay(1200, signal)
  const secondPass = await fetchBatch(allFeeds, signal)
  return secondPass
}
