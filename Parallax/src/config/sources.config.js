/**
 * sources.config.js
 *
 * SINGLE SOURCE OF TRUTH for all outlet definitions.
 * Edit this file to add, remove, or reclassify sources.
 *
 * BIAS CATEGORIES:
 *   "left"        — editorially left-leaning
 *   "center-left" — slightly left of center
 *   "center"      — broadly centrist / wire services
 *   "center-right"— slightly right of center
 *   "right"       — editorially right-leaning
 *
 * BIAS DATA SOURCE:
 *   Ratings are hand-curated from publicly available media-bias research
 *   (AllSides Media Bias Ratings, Ad Fontes Media Bias Chart) as of 2024.
 *   This is a STATIC mapping — it is NOT pulled from a live API.
 *   Extend or override in this file at any time.
 *
 * RSS PROXY:
 *   allorigins.win is a free, open CORS proxy for RSS feeds.
 *   It has no rate limits documented but may be slow or temporarily unavailable.
 *   Replace PROXY_BASE with your own proxy if needed.
 *
 * ASSUMPTION: All RSS feeds listed below are publicly accessible without auth.
 */

export const PROXY_BASE = 'https://api.allorigins.win/get?url='

// Feeds below are temporarily disabled because they consistently fail through
// all configured fetch strategies (proxy + fallback) and create noisy errors.
export const DISABLED_FEEDS = new Set([
  'https://feeds.apnews.com/rss/apf-topnews',
  'https://feeds.apnews.com/rss/apf-usnews',
  'https://feeds.reuters.com/reuters/topNews',
  'https://www.reuters.com/world/rss',
  'https://www.economist.com/sections/united-states/rss.xml',
  'https://www.economist.com/international/rss.xml',
  'https://www.economist.com/the-world-this-week/rss.xml',
  'https://nypost.com/feed/',
])

// ─── Outlet definitions ──────────────────────────────────────────────────────

export const OUTLETS = [
  // ── Left ──────────────────────────────────────────────────────────────────
  {
    id: 'guardian',
    name: 'The Guardian',
    bias: 'left',
    country: 'UK',
    language: 'en',
    feeds: [
      'https://www.theguardian.com/world/rss',
      'https://www.theguardian.com/us-news/rss',
      'https://www.theguardian.com/politics/rss',
    ],
    color: '#005689',
  },
  {
    id: 'huffpost',
    name: 'HuffPost',
    bias: 'left',
    country: 'US',
    language: 'en',
    feeds: ['https://www.huffpost.com/section/front-page/feed'],
    color: '#00aeef',
  },
  {
    id: 'vox',
    name: 'Vox',
    bias: 'left',
    country: 'US',
    language: 'en',
    feeds: ['https://www.vox.com/rss/index.xml'],
    color: '#ffb81c',
  },

  // ── Center-Left ───────────────────────────────────────────────────────────
  {
    id: 'nyt',
    name: 'New York Times',
    bias: 'center-left',
    country: 'US',
    language: 'en',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
    ],
    color: '#000000',
  },
  {
    id: 'wapo',
    name: 'Washington Post',
    bias: 'center-left',
    country: 'US',
    language: 'en',
    feeds: [
      'https://feeds.washingtonpost.com/rss/world',
      'https://feeds.washingtonpost.com/rss/politics',
    ],
    color: '#231f20',
  },
  {
    id: 'bbc',
    name: 'BBC News',
    bias: 'center-left',
    country: 'UK',
    language: 'en',
    feeds: [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://feeds.bbci.co.uk/news/politics/rss.xml',
      'https://feeds.bbci.co.uk/news/business/rss.xml',
    ],
    color: '#bb1919',
  },
  {
    id: 'npr',
    name: 'NPR',
    bias: 'center-left',
    country: 'US',
    language: 'en',
    feeds: [
      'https://feeds.npr.org/1001/rss.xml',
      'https://feeds.npr.org/1004/rss.xml',
    ],
    color: '#00877a',
  },

  // ── Center ────────────────────────────────────────────────────────────────
  {
    id: 'ap',
    name: 'Associated Press',
    bias: 'center',
    country: 'US',
    language: 'en',
    feeds: ['https://apnews.com/apf-topnews?output=rss'],
    color: '#c8102e',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    bias: 'center',
    country: 'UK',
    language: 'en',
    feeds: ['https://www.reuters.com/world/rss'],
    color: '#ff8000',
  },
  {
    id: 'axios',
    name: 'Axios',
    bias: 'center',
    country: 'US',
    language: 'en',
    feeds: ['https://www.axios.com/feed.xml'],
    color: '#ff4136',
  },
  {
    id: 'thehill',
    name: 'The Hill',
    bias: 'center',
    country: 'US',
    language: 'en',
    feeds: ['https://thehill.com/news/feed/'],
    color: '#003366',
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    bias: 'center',
    country: 'QA',
    language: 'en',
    feeds: ['https://www.aljazeera.com/xml/rss/all.xml'],
    color: '#c49a00',
  },
  {
    id: 'dw',
    name: 'DW News',
    bias: 'center',
    country: 'DE',
    language: 'en',
    feeds: ['https://rss.dw.com/rdf/rss-en-all'],
    color: '#003b95',
  },
  {
    id: 'lemonde',
    name: 'Le Monde',
    bias: 'center-left',
    country: 'FR',
    language: 'fr',
    feeds: ['https://www.lemonde.fr/rss/une.xml'],
    color: '#1f4f8c',
  },
  {
    id: 'elmundo',
    name: 'El Mundo',
    bias: 'center-right',
    country: 'ES',
    language: 'es',
    feeds: ['https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml'],
    color: '#0f5fbf',
  },
  {
    id: 'ansa',
    name: 'ANSA',
    bias: 'center',
    country: 'IT',
    language: 'it',
    feeds: ['https://www.ansa.it/sito/ansait_rss.xml'],
    color: '#1b3e8a',
  },

  // ── Center-Right ──────────────────────────────────────────────────────────
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    bias: 'center-right',
    country: 'US',
    language: 'en',
    feeds: ['https://feeds.a.dj.com/rss/RSSWorldNews.xml'],
    color: '#0274b6',
  },
  {
    id: 'economist',
    name: 'The Economist',
    bias: 'center-right',
    country: 'UK',
    language: 'en',
    feeds: ['https://www.economist.com/sections/united-states/rss.xml'],
    color: '#e3120b',
  },

  // ── Right ─────────────────────────────────────────────────────────────────
  {
    id: 'foxnews',
    name: 'Fox News',
    bias: 'right',
    country: 'US',
    language: 'en',
    feeds: ['https://moxie.foxnews.com/google-publisher/latest.xml'],
    color: '#003366',
  },
  {
    id: 'nypost',
    name: 'New York Post',
    bias: 'right',
    country: 'US',
    language: 'en',
    feeds: ['https://nypost.com/news/feed/'],
    color: '#c8102e',
  },
]

// ─── Bias display metadata ────────────────────────────────────────────────────

export const BIAS_META = {
  left: {
    label: 'Left',
    shortLabel: 'L',
    color: '#2563eb',
    bgColor: '#dbeafe',
    order: 0,
  },
  'center-left': {
    label: 'Center-Left',
    shortLabel: 'CL',
    color: '#0891b2',
    bgColor: '#cffafe',
    order: 1,
  },
  center: {
    label: 'Center',
    shortLabel: 'C',
    color: '#059669',
    bgColor: '#d1fae5',
    order: 2,
  },
  'center-right': {
    label: 'Center-Right',
    shortLabel: 'CR',
    color: '#d97706',
    bgColor: '#fef3c7',
    order: 3,
  },
  right: {
    label: 'Right',
    shortLabel: 'R',
    color: '#dc2626',
    bgColor: '#fee2e2',
    order: 4,
  },
  unknown: {
    label: 'Unknown',
    shortLabel: '?',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    order: 5,
  },
}

// Convenience lookup by outlet id
export const OUTLET_MAP = Object.fromEntries(OUTLETS.map((o) => [o.id, o]))

// All known feed URLs → outlet id (for reverse lookup after fetching)
export const FEED_TO_OUTLET = OUTLETS.reduce((acc, outlet) => {
  outlet.feeds.forEach((url) => {
    acc[url] = outlet.id
  })
  return acc
}, {})
