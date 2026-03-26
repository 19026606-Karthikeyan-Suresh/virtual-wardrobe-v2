import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteStorageAsset } from '@/lib/storage'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 2. Fetch the row to get storage paths (RLS also enforces ownership)
  const { data: row, error: fetchError } = await supabase
    .from('vto_results')
    .select('source_photo_path, result_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !row) {
    return NextResponse.json(
      { error: 'VTO result not found' },
      { status: 404 },
    )
  }

  // 3. Delete result image from Storage (best-effort)
  // NOTE: Do NOT delete source_photo_path — it's the user's reference photo
  // shared across multiple VTO generations.
  await Promise.allSettled([
    deleteStorageAsset('vto-results', row.result_path),
  ])

  // 4. Delete the DB row
  const { error: deleteError } = await supabase
    .from('vto_results')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('DB delete error:', deleteError)
    return NextResponse.json(
      { error: 'Failed to delete VTO result' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
