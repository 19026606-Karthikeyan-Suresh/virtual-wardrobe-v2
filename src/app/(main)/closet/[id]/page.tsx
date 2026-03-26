import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GarmentDetailPageClient } from './GarmentDetailPageClient'
import type { Garment } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GarmentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('garments')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    notFound()
  }

  return <GarmentDetailPageClient garment={data as unknown as Garment} />
}
