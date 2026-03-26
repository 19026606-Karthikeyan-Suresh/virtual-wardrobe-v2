'use client'

import { motion } from 'framer-motion'
import { CATEGORIES } from '@/lib/constants'
import type { GarmentCategory } from '@/lib/types'

interface FilterChipsProps {
  selected: GarmentCategory | null
  onChange: (category: GarmentCategory | null) => void
}

const chips: Array<{ label: string; value: GarmentCategory | null }> = [
  { label: 'All', value: null },
  ...CATEGORIES.map((c) => ({ label: c, value: c as GarmentCategory })),
]

export function FilterChips({ selected, onChange }: FilterChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden px-4 pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {chips.map((chip) => {
        const isActive = selected === chip.value

        return (
          <motion.button
            key={chip.label}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            onClick={() => onChange(chip.value)}
            aria-pressed={isActive}
            className={[
              'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              isActive
                ? 'bg-brand text-white'
                : 'bg-surface-raised text-foreground hover:bg-border',
            ].join(' ')}
          >
            {chip.label}
          </motion.button>
        )
      })}
    </div>
  )
}
