'use client'

import { useRouter } from 'next/navigation'
import { GarmentDetailSheet } from '@/features/closet/GarmentDetailSheet'
import type { Garment } from '@/lib/types'

interface GarmentDetailPageClientProps {
  garment: Garment
}

export function GarmentDetailPageClient({ garment }: GarmentDetailPageClientProps) {
  const router = useRouter()

  function handleClose() {
    router.back()
  }

  return (
    <GarmentDetailSheet
      garment={garment}
      isOpen={true}
      onClose={handleClose}
    />
  )
}
