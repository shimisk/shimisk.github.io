import React from 'react'

export default function LoadingSkeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton__image" />
      <div className="skeleton__body">
        <div className="skeleton__line skeleton__line--short" />
        <div className="skeleton__line skeleton__line--title" />
        <div className="skeleton__line skeleton__line--title skeleton__line--title-2" />
        <div className="skeleton__line skeleton__line--desc" />
        <div className="skeleton__line skeleton__line--desc skeleton__line--desc-2" />
        <div className="skeleton__bar" />
      </div>
    </div>
  )
}
