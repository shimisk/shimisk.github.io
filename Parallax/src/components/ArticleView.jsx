import React from 'react'
import { OUTLET_MAP } from '../config/sources.config.js'
import { getBias, getBiasMeta } from '../utils/bias.js'

function formatPublished(date) {
  if (!date) return 'Unknown publication time'
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ArticleView({ article, onBack }) {
  if (!article) return null

  const outlet = OUTLET_MAP[article.outletId]
  const biasMeta = getBiasMeta(getBias(article.outletId))
  const content = article.content || article.description || ''

  return (
    <main className="article-view">
      <div className="article-view__inner">
        <button className="article-view__back" onClick={onBack}>
          ← Back to feed
        </button>

        <article className="article-view__card">
          <div className="article-view__meta">
            <span
              className="article-view__bias"
              style={{ background: biasMeta.bgColor, color: biasMeta.color }}
            >
              {biasMeta.shortLabel}
            </span>
            <span className="article-view__outlet">{outlet?.name ?? article.outletId}</span>
            <span className="article-view__dot">·</span>
            <time className="article-view__time">{formatPublished(article.publishedAt)}</time>
            {article.isTranslated && (
              <span
                className="article-view__translated"
                title={`Auto-translated from ${article.originalLanguage?.toUpperCase() || 'non-English'}`}
              >
                🌐 translated
              </span>
            )}
          </div>

          <h1 className="article-view__title">{article.title}</h1>

          {article.imageUrl && (
            <div className="article-view__image-wrap">
              <img
                className="article-view__image"
                src={article.imageUrl}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.target.parentElement.style.display = 'none'
                }}
              />
            </div>
          )}

          {content ? (
            <div className="article-view__content">
              {content
                .split(/\n+/)
                .map((part) => part.trim())
                .filter(Boolean)
                .map((part, idx) => (
                  <p key={idx}>{part}</p>
                ))}
            </div>
          ) : (
            <p className="article-view__empty">No preview text available for this story.</p>
          )}

          {article.url && (
            <div className="article-view__actions">
              <a
                className="article-view__read-original"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read original article ↗
              </a>
            </div>
          )}
        </article>
      </div>
    </main>
  )
}
