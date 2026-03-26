//Category | Vibe tag with colour coding

type Category = 'Top' | 'Bottom' | 'Dress' | 'Shoes' | 'Accessory' | 'Outerwear'

/** Returns '#000' or '#fff' for maximum contrast against the given hex background. */
function getContrastColour(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '#000'
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  // Relative luminance (WCAG formula)
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return L > 0.179 ? '#000' : '#fff'
}

export interface BadgeProps {
  label: string
  variant?: 'solid' | 'outline'
  /** Use a category name to apply the design-token category color. */
  category?: Category
  /** Custom hex or CSS color — ignored when `category` is set. */
  color?: string
  className?: string
}

const categoryClasses: Record<Category, { solid: string; outline: string }> = {
  Top: {
    solid: 'bg-category-top text-sky-800 dark:text-sky-200',
    outline: 'border border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300',
  },
  Bottom: {
    solid: 'bg-category-bottom text-emerald-800 dark:text-emerald-200',
    outline: 'border border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300',
  },
  Dress: {
    solid: 'bg-category-dress text-pink-800 dark:text-pink-200',
    outline: 'border border-pink-300 text-pink-700 dark:border-pink-700 dark:text-pink-300',
  },
  Shoes: {
    solid: 'bg-category-shoes text-amber-800 dark:text-amber-200',
    outline: 'border border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300',
  },
  Accessory: {
    solid: 'bg-category-accessory text-violet-800 dark:text-violet-200',
    outline: 'border border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300',
  },
  Outerwear: {
    solid: 'bg-category-outerwear text-slate-700 dark:text-slate-200',
    outline: 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300',
  },
}

export function Badge({ label, variant = 'solid', category, color, className = '' }: BadgeProps) {
  // Category-based coloring
  if (category) {
    return (
      <span
        className={[
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          categoryClasses[category][variant],
          className,
        ].join(' ')}
      >
        {label}
      </span>
    )
  }

  // Custom color via inline styles
  if (color) {
    const style: React.CSSProperties =
      variant === 'solid'
        ? { backgroundColor: color, color: getContrastColour(color) }
        : { borderColor: color, color, borderWidth: '1px', borderStyle: 'solid' }

    return (
      <span
        style={style}
        className={[
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          className,
        ].join(' ')}
      >
        {label}
      </span>
    )
  }

  // Fallback: muted neutral
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'solid'
          ? 'bg-surface-raised text-foreground'
          : 'border border-border text-muted',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}
