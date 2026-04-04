import React, { useState } from 'react'
import { OUTLET_MAP } from '../config/sources.config.js'

export default function ErrorBanner({ errors }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !errors.length) return null

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__inner">
        <span className="error-banner__icon" aria-hidden="true">⚠</span>
        <div className="error-banner__text">
          <strong>{errors.length} feed{errors.length > 1 ? 's' : ''} failed to load.</strong>{' '}
          {errors.length <= 3 ? (
            <span>
              {errors.map((e) => OUTLET_MAP[e.outletId]?.name ?? e.outletId).join(', ')} could not be reached.
            </span>
          ) : (
            <span>Some sources may be temporarily unavailable.</span>
          )}
          {' '}Showing available content.
        </div>
        <button
          className="error-banner__dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  )
}
