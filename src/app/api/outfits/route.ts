import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOutfitSchema } from '@/lib/validators'
import type { OutfitWithGarments } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: outfits, error } = await supabase
    .from('outfits')
    .select(`
      *,
      outfit_garments (
        position,
        garments (*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type OutfitGarmentJoin = { position: number; garments: unknown }

  const result: OutfitWithGarments[] = (outfits ?? []).map((outfit) => {
    const { outfit_garments, ...outfitFields } = outfit as typeof outfit & {
      outfit_garments: OutfitGarmentJoin[]
    }
    return {
      ...outfitFields,
      garments: (outfit_garments ?? [])
        .sort((a: OutfitGarmentJoin, b: OutfitGarmentJoin) => a.position - b.position)
        .map((og: OutfitGarmentJoin) => og.garments),
    } as OutfitWithGarments
  })

  return NextResponse.json({ outfits: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createOutfitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, occasion, weather_min_temp, weather_max_temp, garment_ids, positions, is_favourite } = parsed.data

  const { data: outfit, error: insertError } = await supabase
    .from('outfits')
    .insert({
      user_id: user.id,
      name,
      occasion: occasion ?? null,
      weather_min_temp: weather_min_temp ?? null,
      weather_max_temp: weather_max_temp ?? null,
      is_favourite: is_favourite ?? false,
    })
    .select()
    .single()

  if (insertError || !outfit) {
    return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 })
  }

  const junctionRows = garment_ids.map((garment_id, index) => ({
    outfit_id: outfit.id,
    garment_id,
    position: positions?.[index] ?? index,
  }))

  const { error: junctionError } = await supabase
    .from('outfit_garments')
    .insert(junctionRows)

  if (junctionError) {
    // Rollback the outfit row
    await supabase.from('outfits').delete().eq('id', outfit.id)
    return NextResponse.json({ error: junctionError.message }, { status: 500 })
  }

  return NextResponse.json({ outfit }, { status: 201 })
}
