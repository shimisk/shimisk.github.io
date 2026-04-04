# ◈ Parallax — News Without Blinders

A free, fully client-side Progressive Web App for comparing news coverage across outlets, visualising political bias distribution, and surfacing what **wasn't** reported.

> Inspired by Ground News. No backend. No accounts. No paid APIs.

---

## Features

| Feature | Detail |
|---|---|
| **RSS aggregation** | Fetches 14+ outlets via allorigins.win CORS proxy |
| **Bias ratings** | Hardcoded left→right scale (easily overridable) |
| **Story grouping** | Keyword-based heuristic clusters same-story articles |
| **Coverage comparison** | Expandable cards showing all versions of a story |
| **"Not reported by"** | Lists tracked outlets with no matching article |
| **Filters** | By bias category, outlet, keyword search |
| **Sources manager** | Toggle any outlet on/off, persisted to localStorage |
| **PWA** | Installable, offline shell, RSS cache (30 min) |

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

---

## Configuration

**Everything you need to customise lives in one file:**

```
src/config/sources.config.js
```

Edit this to:
- Add or remove outlets
- Change bias ratings
- Change the CORS proxy
- Adjust feed URLs

### Adding an outlet

```js
{
  id: 'mynews',           // unique slug
  name: 'My News Site',
  bias: 'center',         // left | center-left | center | center-right | right
  country: 'US',
  feeds: ['https://mynews.com/rss'],
  color: '#ff0000',       // brand color (used for dot in Sources view)
}
```

---

## Architecture

```
src/
├── config/
│   └── sources.config.js   ← ALL outlet + bias data (edit this)
├── hooks/
│   ├── useFeed.js          ← fetch → normalise → group → cache
│   └── useFilters.js       ← client-side filtering
├── utils/
│   ├── rss.js              ← RSS fetch + XML parse + normalise
│   ├── grouping.js         ← keyword clustering → StoryGroup
│   └── bias.js             ← bias lookup, distribution, balance score
├── components/
│   ├── Header.jsx
│   ├── FiltersBar.jsx
│   ├── FeedView.jsx
│   ├── StoryGroupCard.jsx  ← main card: title, BiasBar, expand, not-reported
│   ├── ArticleRow.jsx      ← single article in expanded coverage list
│   ├── BiasBar.jsx         ← coloured bar showing L/CL/C/CR/R split
│   ├── SourcesView.jsx     ← outlet settings screen
│   ├── ErrorBanner.jsx
│   └── LoadingSkeleton.jsx
└── styles/
    └── global.css          ← all styles, no CSS-in-JS
```

### Data flow

```
RSS feeds (allorigins proxy)
        ↓
  rss.js — fetch + parse XML → Article[]
        ↓
  grouping.js — keyword index + Union-Find → StoryGroup[]
        ↓
  useFeed hook — state + cache + auto-refresh
        ↓
  useFilters hook — client-side filter
        ↓
  FeedView → StoryGroupCard[]
```

---

## Data models

### Article
```js
{
  id:          string,   // hash of URL
  url:         string,
  title:       string,
  description: string,   // max 320 chars, HTML stripped
  imageUrl:    string|null,
  publishedAt: Date|null,
  outletId:    string,   // matches OUTLETS[].id
  feedUrl:     string,
  keywords:    string[], // derived by grouping.js
}
```

### StoryGroup
```js
{
  id:             string,
  articles:       Article[],   // one per outlet
  outletIds:      string[],    // outlets that covered this
  missingIds:     string[],    // tracked outlets that did NOT cover this
  topKeywords:    string[],    // top 5 shared keywords
  publishedAt:    Date|null,   // most recent article date
  representative: Article,     // lead article (most recent)
  size:           number,      // total article count before dedup
}
```

---

## Bias approach & limitations

- Bias ratings are **static** and **manually curated**
- Sources: AllSides Media Bias Chart, Ad Fontes Media Bias Chart (public reference, 2024)
- This app is NOT affiliated with or endorsed by AllSides or Ad Fontes
- No real-time bias API is used (none are free)
- Override any rating by editing `sources.config.js`
- The `bias.js` module has a `RESOLVERS` chain — add a `userOverrideResolver` to let users set their own ratings

---

## Story grouping limitations

The keyword heuristic works well for **hard news** (specific names, places, events). It works less well for:
- Opinion/analysis pieces on the same broad topic
- Stories with very different headline styles
- Foreign-language stories (not currently supported)

To improve grouping: replace or supplement the keyword approach in `grouping.js` with a more sophisticated algorithm (e.g., TF-IDF, Levenshtein on titles, or semantic similarity via a local WASM model).

---

## PWA / offline

- Service worker via `vite-plugin-pwa` (Workbox)
- App shell cached on install
- RSS responses cached for 30 minutes (NetworkFirst strategy)
- `localStorage` cache of last-fetched articles for instant load

---

## Free APIs & services used

| Service | Purpose | Cost |
|---|---|---|
| `allorigins.win` | CORS proxy for RSS feeds | Free, open source |
| Google Fonts | Playfair Display, Source Serif 4, JetBrains Mono | Free |
| RSS feeds | News content | Free/public |

No API keys required.

---

## Extending

### Add a real-time bias API
Add a new resolver to `bias.js`:
```js
const myApiResolver = async (outletId) => {
  const res = await fetch(`https://mybias.api/${outletId}`)
  const data = await res.json()
  return data.bias ?? null
}
```

### Add a second grouping pass
After keyword clustering, add a title-similarity pass in `grouping.js`:
```js
// Levenshtein distance on normalised titles
// Connect articles if distance < threshold
```

### Add user-defined bias overrides
```js
// In bias.js RESOLVERS:
const userOverrideResolver = (outletId) =>
  localStorage.getItem(`parallax:bias:${outletId}`) ?? null
```
