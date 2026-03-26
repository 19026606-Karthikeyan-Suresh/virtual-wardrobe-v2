import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VTOResult } from '@/lib/types'

export async function GET() {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch VTO results ordered by most recent
  const { data: results, error: dbError } = await supabase
    .from('vto_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error('DB query error:', dbError)
    return NextResponse.json(
      { error: 'Failed to fetch VTO results' },
      { status: 500 },
    )
  }

  return NextResponse.json({ results: (results ?? []) as VTOResult[] })
}
