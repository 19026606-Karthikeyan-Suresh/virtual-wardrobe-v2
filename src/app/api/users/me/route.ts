import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = await createClient()

  // 1. Validate auth session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // 2. Delete garments storage files
  try {
    const { data: garmentFiles } = await supabase.storage.from('garments').list(userId)
    if (garmentFiles && garmentFiles.length > 0) {
      const paths = garmentFiles.map((f) => `${userId}/${f.name}`)
      await supabase.storage.from('garments').remove(paths)
    }
  } catch (err) {
    console.error('Error deleting garment storage files:', err)
  }

  // 3. Delete vto-results storage files
  try {
    const { data: vtoFiles } = await supabase.storage.from('vto-results').list(userId)
    if (vtoFiles && vtoFiles.length > 0) {
      const paths = vtoFiles.map((f) => `${userId}/${f.name}`)
      await supabase.storage.from('vto-results').remove(paths)
    }
  } catch (err) {
    console.error('Error deleting VTO storage files:', err)
  }

  // 4. Delete DB rows in dependency order (FK cascades handle children)
  const deletionErrors: string[] = []

  const tables = [
    'vto_results',
    'daily_logs',
    'outfit_garments',
    'outfits',
    'garments',
    'users',
  ] as const

  for (const table of tables) {
    try {
      if (table === 'outfit_garments') {
        // outfit_garments has no user_id — cascade from outfits handles it
        continue
      }
      const { error: tableError } = await supabase
        .from(table)
        .delete()
        .eq('user_id' as string, userId)
      if (tableError) {
        deletionErrors.push(`${table}: ${tableError.message}`)
        console.error(`Error deleting from ${table}:`, tableError)
      }
    } catch (err) {
      deletionErrors.push(`${table}: ${err instanceof Error ? err.message : 'unknown error'}`)
      console.error(`Error deleting from ${table}:`, err)
    }
  }

  // 5. Delete Supabase auth account using service role key
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      deletionErrors.push(`auth: ${deleteError.message}`)
      console.error('Error deleting auth user:', deleteError)
    }
  } catch (err) {
    deletionErrors.push(`auth: ${err instanceof Error ? err.message : 'unknown error'}`)
    console.error('Error calling admin.deleteUser:', err)
  }

  if (deletionErrors.length > 0) {
    return NextResponse.json(
      { success: false, partial: true, errors: deletionErrors },
      { status: 207 }
    )
  }

  return NextResponse.json({ success: true })
}
