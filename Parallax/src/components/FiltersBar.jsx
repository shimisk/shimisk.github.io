import React from 'react'
import { BIAS_META, OUTLETS } from '../config/sources.config.js'

const BIAS_OPTIONS = [
  { value: 'all', label: 'All Bias' },
  ...Object.entries(BIAS_META)
    .filter(([k]) => k !== 'unknown')
    .sort((a, b) => a[1].order - b[1].order)
    .map(([value, meta]) => ({ value, label: meta.label })),
]

export default function FiltersBar({
  biasFilter,
  setBiasFilter,
  outletFilter,
  setOutletFilter,
  searchQuery,
  setSearchQuery,
  activeOutlets,
}) {
  const activeOutletSet = new Set(activeOutlets.map((outlet) => outlet.id))

  return (
    <div className="filters">
      <div className="filters__inner">
        {/* Search */}
        <div className="filters__search-wrap">
          <span className="filters__search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="filters__search"
            placeholder="Search stories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search stories"
          />
          {searchQuery && (
            <button className="filters__clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Bias pills */}
        <div className="filters__pills" role="group" aria-label="Filter by bias">
          {BIAS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filters__pill ${biasFilter === opt.value ? 'is-active' : ''}`}
              onClick={() => setBiasFilter(opt.value)}
              style={
                biasFilter === opt.value && opt.value !== 'all'
                  ? {
                      background: BIAS_META[opt.value]?.bgColor,
                      color: BIAS_META[opt.value]?.color,
                      borderColor: BIAS_META[opt.value]?.color,
                    }
                  : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Outlet select */}
        <select
          className="filters__outlet-select"
          value={outletFilter}
          onChange={(e) => setOutletFilter(e.target.value)}
          aria-label="Filter by outlet"
        >
          <option value="all">All Sources</option>
          {OUTLETS.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {activeOutletSet.has(outlet.id)
                ? outlet.name
                : `${outlet.name} (inactive)`}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
