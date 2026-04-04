import React, { useState } from 'react'
import { useFeed } from './hooks/useFeed.js'
import { useFilters } from './hooks/useFilters.js'
import Header from './components/Header.jsx'
import FiltersBar from './components/FiltersBar.jsx'
import FeedView from './components/FeedView.jsx'
import ArticleView from './components/ArticleView.jsx'
import SourcesView from './components/SourcesView.jsx'
import ErrorBanner from './components/ErrorBanner.jsx'

export default function App() {
  const [view, setView] = useState('feed') // 'feed' | 'sources'
  const [activeArticle, setActiveArticle] = useState(null)
  const {
    groups,
    errors,
    isLoading,
    lastFetched,
    refresh,
    activeOutlets,
    activeOutletIds,
    setActiveOutlets,
  } = useFeed()

  const {
    filteredGroups,
    biasFilter,
    setBiasFilter,
    outletFilter,
    setOutletFilter,
    searchQuery,
    setSearchQuery,
  } = useFilters(groups, activeOutletIds)

  function handleSetView(nextView) {
    setView(nextView)
    if (nextView !== 'feed') {
      setActiveArticle(null)
    }
  }

  function handleOpenArticle(article) {
    setActiveArticle(article)
    setView('feed')
  }

  function handleCloseArticle() {
    setActiveArticle(null)
  }

  return (
    <div className="app">
      <Header
        view={view}
        setView={handleSetView}
        isLoading={isLoading}
        lastFetched={lastFetched}
        onRefresh={refresh}
      />

      {errors.length > 0 && <ErrorBanner errors={errors} />}

      {view === 'feed' && !activeArticle && (
        <>
          <FiltersBar
            biasFilter={biasFilter}
            setBiasFilter={setBiasFilter}
            outletFilter={outletFilter}
            setOutletFilter={setOutletFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeOutlets={activeOutlets}
          />
          <FeedView
            groups={filteredGroups}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onOpenArticle={handleOpenArticle}
          />
        </>
      )}

      {view === 'feed' && activeArticle && (
        <ArticleView article={activeArticle} onBack={handleCloseArticle} />
      )}

      {view === 'sources' && (
        <SourcesView
          activeOutletIds={activeOutletIds}
          setActiveOutlets={setActiveOutlets}
        />
      )}
    </div>
  )
}
