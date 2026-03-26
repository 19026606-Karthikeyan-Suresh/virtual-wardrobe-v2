import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateOutfitSchema } from '@/lib/validators'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateOutfitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { garment_ids, positions, ...outfitFields } = parsed.data

  // Update outfit row — RLS ensures only owner can update
  const { data: outfit, error: updateError } = await supabase
    .from('outfits')
    .update(outfitFields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (!outfit) {
    return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
  }

  // Reconcile junction table if garment_ids provided
  if (garment_ids !== undefined) {
    // Fetch existing junction rows for rollback
    const { data: existingJunction } = await supabase
      .from('outfit_garments')
      .select('outfit_id, garment_id, position')
      .eq('outfit_id', id)

    const { error: deleteError } = await supabase
      .from('outfit_garments')
      .delete()
      .eq('outfit_id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const junctionRows = garment_ids.map((garment_id, index) => ({
      outfit_id: id,
      garment_id,
      position: positions?.[index] ?? index,
    }))

    const { error: insertError } = await supabase
      .from('outfit_garments')
      .insert(junctionRows)

    if (insertError) {
      // Rollback: restore previous junction rows
      if (existingJunction && existingJunction.length > 0) {
        await supabase.from('outfit_garments').insert(existingJunction)
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ outfit })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error, count } = await supabase
    .from('outfits')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
