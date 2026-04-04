import React from 'react'

function formatTime(date) {
  if (!date) return null
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Header({ view, setView, isLoading, lastFetched, onRefresh }) {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__logo" aria-hidden="true">◈</span>
          <span className="header__wordmark">Parallax</span>
          <span className="header__tagline">news without blinders</span>
        </div>

        <nav className="header__nav">
          <button
            className={`header__nav-btn ${view === 'feed' ? 'is-active' : ''}`}
            onClick={() => setView('feed')}
          >
            Feed
          </button>
          <button
            className={`header__nav-btn ${view === 'sources' ? 'is-active' : ''}`}
            onClick={() => setView('sources')}
          >
            Sources
          </button>
        </nav>

        <div className="header__actions">
          {lastFetched && !isLoading && (
            <span className="header__timestamp">
              {formatTime(lastFetched)}
            </span>
          )}
          <button
            className={`header__refresh ${isLoading ? 'is-spinning' : ''}`}
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh feed"
            title="Refresh feed"
          >
            ↻
          </button>
        </div>
      </div>
    </header>
  )
}
