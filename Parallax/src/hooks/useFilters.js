/**
 * useFilters.js
 *
 * Manages filter state: bias category, outlet, search query.
 * Applies filtering client-side against the full groups array.
 */

import { useState, useMemo, useEffect } from 'react'
import { OUTLET_MAP } from '../config/sources.config.js'
import { getBias } from '../utils/bias.js'

export function useFilters(groups, activeOutletIds = []) {
  const [biasFilter, setBiasFilter] = useState('all')
  const [outletFilter, setOutletFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (outletFilter !== 'all' && !activeOutletIds.includes(outletFilter)) {
      setOutletFilter('all')
    }
  }, [activeOutletIds, outletFilter])

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Bias filter
      if (biasFilter !== 'all') {
        const hasBias = group.outletIds.some(
          (id) => getBias(id) === biasFilter
        )
        if (!hasBias) return false
      }

      // Outlet filter
      if (outletFilter !== 'all') {
        if (!group.outletIds.includes(outletFilter)) return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const inTitle = group.representative.title.toLowerCase().includes(q)
        const inKeywords = group.topKeywords.some((kw) => kw.includes(q))
        const inOutlet = group.outletIds.some(
          (id) => OUTLET_MAP[id]?.name.toLowerCase().includes(q)
        )
        if (!inTitle && !inKeywords && !inOutlet) return false
      }

      return true
    })
  }, [groups, biasFilter, outletFilter, searchQuery])

  return {
    filteredGroups,
    biasFilter,
    setBiasFilter,
    outletFilter,
    setOutletFilter,
    searchQuery,
    setSearchQuery,
  }
}
