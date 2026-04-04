/**
 * useFeed.js
 *
 * Custom hook that owns the complete data lifecycle:
 *   fetch → normalise → group → expose
 *
 * Returns:
 * {
 *   groups:       StoryGroup[]
 *   articles:     Article[]
 *   errors:       FeedError[]
 *   isLoading:    boolean
 *   lastFetched:  Date | null
 *   refresh:      () => void
 *   activeOutlets: Outlet[]
 *   setActiveOutlets: (ids: string[]) => void
 * }
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { OUTLETS } from '../config/sources.config.js'
import { fetchAllFeeds } from '../utils/rss.js'
import { groupArticles } from '../utils/grouping.js'

const REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
const ARTICLE_WINDOW_MS = 24 * 60 * 60 * 1000 // last 24 hours
const STORAGE_KEY_ACTIVE = 'parallax:activeOutlets'
const STORAGE_KEY_CACHE = 'parallax:articleCache'

function withinArticleWindow(article, nowTs = Date.now()) {
  if (!article?.publishedAt) return false
  const publishedTs = article.publishedAt instanceof Date
    ? article.publishedAt.getTime()
    : new Date(article.publishedAt).getTime()
  if (Number.isNaN(publishedTs)) return false
  return nowTs - publishedTs <= ARTICLE_WINDOW_MS
}

function filterRecentArticles(articles) {
  const nowTs = Date.now()
  return articles.filter((article) => withinArticleWindow(article, nowTs))
}

function loadActiveOutletIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVE)
    if (stored) {
      const ids = JSON.parse(stored)
      // Validate against known outlets
      const known = new Set(OUTLETS.map((o) => o.id))
      return ids.filter((id) => known.has(id))
    }
  } catch {}
  // Default: all outlets active
  return OUTLETS.map((o) => o.id)
}

function saveActiveOutletIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(ids))
  } catch {}
}

function loadCachedArticles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CACHE)
    if (stored) {
      const { articles, timestamp } = JSON.parse(stored)
      // Only use cache if < 30 minutes old
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        return articles.map((a) => ({
          ...a,
          publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
        }))
      }
    }
  } catch {}
  return null
}

function saveCachedArticles(articles) {
  try {
    localStorage.setItem(
      STORAGE_KEY_CACHE,
      JSON.stringify({ articles, timestamp: Date.now() })
    )
  } catch {}
}

export function useFeed() {
  const [activeOutletIds, setActiveOutletIdsRaw] = useState(loadActiveOutletIds)
  const [articles, setArticles] = useState([])
  const [groups, setGroups] = useState([])
  const [errors, setErrors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetched, setLastFetched] = useState(null)
  const abortRef = useRef(null)
  const refreshTimerRef = useRef(null)

  const activeOutlets = OUTLETS.filter((o) => activeOutletIds.includes(o.id))

  const setActiveOutlets = useCallback((ids) => {
    setActiveOutletIdsRaw(ids)
    saveActiveOutletIds(ids)
  }, [])

  const runFetch = useCallback(
    async (outlets) => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)
      setErrors([])

      try {
        const { articles: fetched, errors: fetchErrors } = await fetchAllFeeds(
          outlets,
          controller.signal
        )

        if (controller.signal.aborted) return

        const recentArticles = filterRecentArticles(fetched)
        const hasAnyArticles = recentArticles.length > 0
        const allFailed = fetchErrors.length > 0 && !hasAnyArticles

        if (allFailed) {
          // Preserve currently visible stories if this refresh produced no data.
          setErrors(fetchErrors)
          setLastFetched(new Date())
          return
        }

        saveCachedArticles(recentArticles)
        const allOutletIds = outlets.map((o) => o.id)
        const storyGroups = groupArticles(recentArticles, allOutletIds)

        setArticles(recentArticles)
        setGroups(storyGroups)
        setErrors(fetchErrors)
        setLastFetched(new Date())
      } catch (err) {
        if (err.name === 'AbortError') return
        setErrors([{ feedUrl: 'all', outletId: 'all', message: err.message }])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    },
    []
  )

  const refresh = useCallback(() => {
    runFetch(activeOutlets)
  }, [activeOutlets, runFetch])

  // On mount: try cache first, then fetch
  useEffect(() => {
    const cached = loadCachedArticles()
    if (cached?.length) {
      const recentCached = filterRecentArticles(cached)
      const allOutletIds = OUTLETS.map((o) => o.id)
      const storyGroups = groupArticles(recentCached, allOutletIds)
      setArticles(recentCached)
      setGroups(storyGroups)
      setIsLoading(false)
    }
    runFetch(OUTLETS)

    // Auto-refresh
    refreshTimerRef.current = setInterval(() => runFetch(OUTLETS), REFRESH_INTERVAL_MS)
    return () => {
      clearInterval(refreshTimerRef.current)
      abortRef.current?.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run grouping when active outlets change (filtering changes missingIds)
  useEffect(() => {
    if (!articles.length) return
    const filteredArticles = articles.filter((a) => activeOutletIds.includes(a.outletId))
    const storyGroups = groupArticles(filteredArticles, activeOutletIds)
    setGroups(storyGroups)
  }, [activeOutletIds]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    groups,
    articles,
    errors,
    isLoading,
    lastFetched,
    refresh,
    activeOutlets,
    activeOutletIds,
    setActiveOutlets,
  }
}
