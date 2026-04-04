import React, { useState } from 'react'
import { OUTLET_MAP, BIAS_META } from '../config/sources.config.js'
import { getBias, getBiasMeta, computeBalanceScore } from '../utils/bias.js'
import BiasBar from './BiasBar.jsx'
import ArticleRow from './ArticleRow.jsx'

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StoryGroupCard({ group, onOpenArticle }) {
  const [expanded, setExpanded] = useState(false)
  const { representative, articles, outletIds, missingIds, topKeywords, publishedAt } = group

  const coverageCount = outletIds.length
  const balanceScore = computeBalanceScore(outletIds)
  const balanceLabel =
    balanceScore > 0.6 ? 'Broad coverage' : balanceScore > 0.3 ? 'Partial coverage' : 'Narrow coverage'

  const repOutlet = OUTLET_MAP[representative.outletId]
  const repBiasMeta = getBiasMeta(getBias(representative.outletId))

  return (
    <article className={`story-card ${expanded ? 'is-expanded' : ''}`}>
      {/* ── Lead image ── */}
      {representative.imageUrl && (
        <div className="story-card__image-wrap">
          <img
            src={representative.imageUrl}
            alt=""
            className="story-card__image"
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="story-card__body">
        {/* Source badge + time */}
        <div className="story-card__meta-top">
          <span
            className="story-card__bias-badge"
            style={{
              background: repBiasMeta.bgColor,
              color: repBiasMeta.color,
            }}
          >
            {repBiasMeta.shortLabel}
          </span>
          <span className="story-card__outlet">{repOutlet?.name ?? representative.outletId}</span>
          <span className="story-card__dot" aria-hidden="true">·</span>
          <time className="story-card__time">{timeAgo(publishedAt)}</time>
          {representative.isTranslated && (
            <span
              className="story-card__translated"
              title={`Auto-translated from ${representative.originalLanguage?.toUpperCase() || 'non-English'}`}
            >
              🌐 translated
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="story-card__title">
          <button
            type="button"
            className="story-card__title-link"
            onClick={() => onOpenArticle?.(representative)}
          >
            {representative.title}
          </button>
        </h2>

        {/* Description */}
        {representative.description && (
          <p className="story-card__desc">{representative.description}</p>
        )}

        {/* Keywords */}
        {topKeywords.length > 0 && (
          <div className="story-card__keywords">
            {topKeywords.map((kw) => (
              <span key={kw} className="story-card__kw">{kw}</span>
            ))}
          </div>
        )}

        {/* Bias bar */}
        <BiasBar outletIds={outletIds} />

        {/* Coverage summary row */}
        <div className="story-card__coverage-row">
          <button
            className="story-card__coverage-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="story-card__coverage-count">
              {coverageCount} {coverageCount === 1 ? 'outlet' : 'outlets'} covered this
            </span>
            <span className="story-card__balance-label">{balanceLabel}</span>
            <span className="story-card__toggle-icon" aria-hidden="true">
              {expanded ? '▲' : '▼'}
            </span>
          </button>
        </div>

        {/* Expanded: article list + not-mentioned */}
        {expanded && (
          <div className="story-card__expanded">
            <div className="story-card__articles">
              <p className="story-card__section-label">Coverage</p>
              {articles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onOpenArticle={onOpenArticle}
                />
              ))}
            </div>

            {missingIds.length > 0 && (
              <div className="story-card__missing">
                <p className="story-card__section-label story-card__section-label--missing">
                  Not reported by
                </p>
                <div className="story-card__missing-list">
                  {missingIds.map((id) => {
                    const outlet = OUTLET_MAP[id]
                    const bias = getBias(id)
                    const biasMeta = getBiasMeta(bias)
                    return (
                      <span
                        key={id}
                        className="story-card__missing-badge"
                        style={{ borderColor: biasMeta.color, color: biasMeta.color }}
                      >
                        {outlet?.name ?? id}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
