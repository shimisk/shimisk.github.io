import React from 'react'
import StoryGroupCard from './StoryGroupCard.jsx'
import LoadingSkeleton from './LoadingSkeleton.jsx'

export default function FeedView({ groups, isLoading, searchQuery, onOpenArticle }) {
  if (isLoading && !groups.length) {
    return (
      <main className="feed">
        <div className="feed__inner">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </main>
    )
  }

  if (!isLoading && !groups.length) {
    return (
      <main className="feed">
        <div className="feed__inner">
          <div className="feed__empty">
            {searchQuery
              ? `No stories match "${searchQuery}"`
              : 'No stories loaded. Check your connection and try refreshing.'}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="feed">
      <div className="feed__inner">
        <div className="feed__meta">
          <span className="feed__count">
            {groups.length} {groups.length === 1 ? 'story' : 'stories'}
          </span>
          <span className="feed__window">Last 24h</span>
          {isLoading && <span className="feed__updating">Updating…</span>}
        </div>

        {groups.map((group) => (
          <StoryGroupCard
            key={group.id}
            group={group}
            onOpenArticle={onOpenArticle}
          />
        ))}
      </div>
    </main>
  )
}
