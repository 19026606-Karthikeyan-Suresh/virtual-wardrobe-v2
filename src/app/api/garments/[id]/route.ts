import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateGarmentSchema } from '@/lib/validators'
import { deleteStorageAsset } from '@/lib/storage'
import type { Garment } from '@/lib/types'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const parsed = updateGarmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('garments')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Garment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ garment: data as Garment })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const hardDelete = request.nextUrl.searchParams.get('hard') === 'true'

  // Fetch the garment first to verify ownership and get storage paths
  const { data: garment, error: fetchError } = await supabase
    .from('garments')
    .select('id, user_id, image_path, thumb_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !garment) {
    return NextResponse.json({ error: 'Garment not found' }, { status: 404 })
  }

  if (hardDelete) {
    // Delete storage assets (image and thumb may be the same path)
    const pathsToDelete = new Set([garment.image_path, garment.thumb_path])
    for (const path of pathsToDelete) {
      try {
        await deleteStorageAsset('garments', path)
      } catch {
        // Log but don't block — DB row deletion is the critical step
      }
    }

    const { error: deleteError } = await supabase
      .from('garments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
  } else {
    // Soft delete
    const { error: updateError } = await supabase
      .from('garments')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
