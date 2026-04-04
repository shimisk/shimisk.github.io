import React from 'react'
import { OUTLET_MAP } from '../config/sources.config.js'
import { getBias, getBiasMeta } from '../utils/bias.js'

export default function ArticleRow({ article, onOpenArticle }) {
  const outlet = OUTLET_MAP[article.outletId]
  const biasMeta = getBiasMeta(getBias(article.outletId))

  return (
    <button
      type="button"
      className="article-row"
      onClick={() => onOpenArticle?.(article)}
    >
      <span
        className="article-row__bias"
        style={{ background: biasMeta.bgColor, color: biasMeta.color }}
        title={biasMeta.label}
      >
        {biasMeta.shortLabel}
      </span>
      <span className="article-row__outlet">{outlet?.name ?? article.outletId}</span>
      <span className="article-row__title">{article.title}</span>
      {article.isTranslated && (
        <span
          className="article-row__translated"
          title={`Auto-translated from ${article.originalLanguage?.toUpperCase() || 'non-English'}`}
        >
          🌐
        </span>
      )}
      <span className="article-row__arrow" aria-hidden="true">→</span>
    </button>
  )
}
