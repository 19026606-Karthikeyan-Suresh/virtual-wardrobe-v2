import { forwardRef, useId } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        // eslint-disable-next-line jsx-a11y/aria-props
        aria-invalid={!!error ? 'true': 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[
          'w-full px-3 py-2 rounded-lg border bg-background text-foreground',
          'placeholder:text-muted text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'transition',
          error ? 'border-red-500 dark:border-red-400' : 'border-border',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export { Input }
