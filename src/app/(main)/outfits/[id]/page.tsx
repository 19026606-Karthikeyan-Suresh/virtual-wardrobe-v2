import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OutfitDetailClient } from './OutfitDetailClient'
import type { OutfitWithGarments, Garment } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OutfitDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: outfit, error } = await supabase
    .from('outfits')
    .select('*, outfit_garments(position, garments(*))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !outfit) notFound()

  // Shape the data
  const shaped: OutfitWithGarments = {
    ...(outfit as unknown as OutfitWithGarments),
    garments: ((outfit as unknown as { outfit_garments: { garments: Garment }[] }).outfit_garments ?? [])
      .map((og) => og.garments)
      .filter(Boolean),
  }

  return <OutfitDetailClient outfit={shaped} />
}
