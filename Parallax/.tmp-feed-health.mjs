import { OUTLETS } from './src/config/sources.config.js'
import { writeFileSync } from 'node:fs'

const feeds = OUTLETS.flatMap((o) => o.feeds.map((url) => ({ id: o.id, url })))
const timeoutMs = 12000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function tryAttempt(name, url, checker) {
  try {
    const res = await fetchWithTimeout(url)
    await checker(res)
    return { ok: true, name }
  } catch (err) {
    return { ok: false, name, error: err?.message ?? String(err) }
  }
}

async function checkFeed(feed) {
  const u = encodeURIComponent(feed.url)
  const attempts = []

  attempts.push(
    await tryAttempt('allorigins-get', `https://api.allorigins.win/get?url=${u}`, async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.contents) throw new Error('empty payload')
    })
  )

  attempts.push(
    await tryAttempt('allorigins-raw', `https://api.allorigins.win/raw?url=${u}`, async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.trim()) throw new Error('empty payload')
    })
  )

  attempts.push(
    await tryAttempt('rss2json', `https://api.rss2json.com/v1/api.json?rss_url=${u}`, async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json?.status !== 'ok') throw new Error(json?.message || 'bad status')
      if (!Array.isArray(json?.items) || json.items.length === 0) throw new Error('no items')
    })
  )

  const firstOk = attempts.find((a) => a.ok)
  return {
    ...feed,
    ok: Boolean(firstOk),
    via: firstOk?.name ?? null,
    attempts,
  }
}

const results = []
for (const feed of feeds) {
  results.push(await checkFeed(feed))
}

writeFileSync('.feed-health.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))
console.log(`wrote .feed-health.json with ${results.length} feeds`)
