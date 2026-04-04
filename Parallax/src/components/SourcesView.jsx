import React from 'react'
import { OUTLETS, BIAS_META } from '../config/sources.config.js'
import { getBias, getBiasMeta } from '../utils/bias.js'

const BIAS_ORDER = ['left', 'center-left', 'center', 'center-right', 'right']

function groupByBias(outlets) {
  const groups = {}
  BIAS_ORDER.forEach((b) => (groups[b] = []))
  outlets.forEach((o) => {
    const bias = getBias(o.id)
    if (groups[bias]) groups[bias].push(o)
    else groups['center'].push(o)
  })
  return groups
}

export default function SourcesView({ activeOutletIds, setActiveOutlets }) {
  const activeSet = new Set(activeOutletIds)
  const byBias = groupByBias(OUTLETS)

  function toggle(id) {
    const next = activeSet.has(id)
      ? activeOutletIds.filter((x) => x !== id)
      : [...activeOutletIds, id]
    setActiveOutlets(next)
  }

  function toggleAll(ids) {
    const allActive = ids.every((id) => activeSet.has(id))
    if (allActive) {
      setActiveOutlets(activeOutletIds.filter((id) => !ids.includes(id)))
    } else {
      const merged = new Set([...activeOutletIds, ...ids])
      setActiveOutlets([...merged])
    }
  }

  return (
    <main className="sources-view">
      <div className="sources-view__inner">
        <div className="sources-view__header">
          <h1 className="sources-view__title">Sources</h1>
          <p className="sources-view__subtitle">
            Choose which outlets to include in your feed. Bias ratings are based
            on publicly available media-bias research and are manually curated —
            they are not real-time data.
          </p>
        </div>

        {BIAS_ORDER.map((bias) => {
          const outlets = byBias[bias]
          if (!outlets.length) return null
          const meta = getBiasMeta(bias)
          const groupIds = outlets.map((o) => o.id)
          const allGroupActive = groupIds.every((id) => activeSet.has(id))

          return (
            <section key={bias} className="sources-section">
              <div className="sources-section__heading">
                <span
                  className="sources-section__bias-label"
                  style={{ color: meta.color, borderColor: meta.color }}
                >
                  {meta.label}
                </span>
                <button
                  className="sources-section__toggle-all"
                  onClick={() => toggleAll(groupIds)}
                >
                  {allGroupActive ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <ul className="sources-list">
                {outlets.map((outlet) => {
                  const isActive = activeSet.has(outlet.id)
                  return (
                    <li key={outlet.id} className="sources-list__item">
                      <label className="sources-item">
                        <input
                          type="checkbox"
                          className="sources-item__check"
                          checked={isActive}
                          onChange={() => toggle(outlet.id)}
                        />
                        <span
                          className="sources-item__dot"
                          style={{ background: outlet.color ?? meta.color }}
                        />
                        <span className="sources-item__name">{outlet.name}</span>
                        <span className="sources-item__country">{outlet.country}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        <div className="sources-view__disclaimer">
          <p>
            <strong>Disclaimer:</strong> Bias classifications are approximate and
            based on aggregated third-party ratings. No classification is perfect.
            This data is not provided by or affiliated with AllSides, Ad Fontes, or
            any other organization.
          </p>
        </div>
      </div>
    </main>
  )
}
