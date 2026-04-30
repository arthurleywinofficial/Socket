import type { FC } from 'react'

const LoadingSkeleton: FC = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
    </div>
  )
}

export default LoadingSkeleton
