import React from 'react'
import { BIAS_META } from '../config/sources.config.js'
import { getBias } from '../utils/bias.js'

const BIAS_ORDER = ['left', 'center-left', 'center', 'center-right', 'right']

export default function BiasBar({ outletIds }) {
  if (!outletIds.length) return null

  // Count outlets per bias category
  const counts = {}
  BIAS_ORDER.forEach((b) => (counts[b] = 0))
  outletIds.forEach((id) => {
    const bias = getBias(id)
    if (BIAS_ORDER.includes(bias)) counts[bias]++
  })

  const total = outletIds.length
  if (total === 0) return null

  return (
    <div className="bias-bar">
      <div className="bias-bar__bar-row">
        {BIAS_ORDER.map((bias) => {
          const count = counts[bias]
          if (!count) return null
          const pct = (count / total) * 100
          const meta = BIAS_META[bias]
          return (
            <div
              key={bias}
              className="bias-bar__segment"
              style={{ width: `${pct}%`, background: meta.color, flexShrink: 0 }}
              title={`${meta.label}: ${count} outlet${count !== 1 ? 's' : ''}`}
            />
          )
        })}
      </div>
      <div className="bias-bar__labels">
        {BIAS_ORDER.map((bias) => {
          const count = counts[bias]
          if (!count) return null
          const meta = BIAS_META[bias]
          return (
            <span key={bias} className="bias-bar__label" style={{ color: meta.color }}>
              {meta.shortLabel} {count}
            </span>
          )
        })}
      </div>
    </div>
  )
}
