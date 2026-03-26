'use client'

import { motion } from 'framer-motion' //Animate button on "hover, click"
import { forwardRef } from 'react' //Lets parent components access the underlying element 

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  className?: string
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand text-brand-foreground hover:bg-brand-hover focus:ring-brand',
  secondary:
    'bg-surface border border-border text-foreground hover:bg-surface-raised focus:ring-brand',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-600',
  ghost:
    'bg-transparent text-foreground hover:bg-surface-raised focus:ring-brand',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

//Standard button to be primary and medium sized
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    className = '',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  )
})

Button.displayName = 'Button'

export { Button }
