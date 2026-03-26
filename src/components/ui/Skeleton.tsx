//Animated loading placeholder (simple css pulse)

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  rounded?: boolean
  className?: string
}

export function Skeleton({ width, height, rounded = false, className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      role="status"
      aria-label="Loading…"
      style={style}
      className={[
        'animate-pulse bg-surface-raised',
        rounded ? 'rounded-full' : 'rounded-md',
        className,
      ].join(' ')}
    />
  )
}
