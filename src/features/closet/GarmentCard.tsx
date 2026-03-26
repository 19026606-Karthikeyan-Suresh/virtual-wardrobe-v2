'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui'
import type { Garment } from '@/lib/types'

// Module-level singleton — safe because this file carries 'use client'
const supabase = createClient()

interface GarmentCardProps {
  garment: Garment
}

export function GarmentCard({ garment }: GarmentCardProps) {
  const router = useRouter()

  const { data: { publicUrl } } = supabase.storage
    .from('garments')
    .getPublicUrl(garment.thumb_path)
  const thumbUrl = publicUrl

  function handleClick() {
    router.push(`/closet/${garment.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="break-inside-avoid mb-3 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${garment.name}`}
    >
      <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="relative w-full aspect-[3/4] bg-surface-raised">
          <Image
            src={thumbUrl}
            alt={garment.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>

        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {garment.name}
          </p>
          <Badge
            label={garment.category}
            category={garment.category}
            variant="solid"
            className="shrink-0"
          />
        </div>
      </div>
    </motion.div>
  )
}
