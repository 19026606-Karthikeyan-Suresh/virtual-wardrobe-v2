export interface CardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function Card({ children, onClick, className = '' }: CardProps) {
  const isInteractive = typeof onClick === 'function'

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={[
        'bg-surface rounded-xl border border-border',
        isInteractive
          ? 'cursor-pointer hover:shadow-md hover:border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand'
          : '',
        'transition-shadow duration-200',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
