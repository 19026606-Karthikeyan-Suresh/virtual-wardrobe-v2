import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SLEEPING_THRESHOLD_DAYS } from '@/lib/constants'

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

  // 2. Compute cutoff date
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - SLEEPING_THRESHOLD_DAYS)
  const cutoffISO = cutoff.toISOString().split('T')[0] // YYYY-MM-DD

  // 3. Query active garments not worn within the threshold (or never worn)
  const { data: garments, error: queryError } = await supabase
    .from('garments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .or(`last_worn_at.is.null,last_worn_at.lt.${cutoffISO}`)
    .order('last_worn_at', { ascending: true, nullsFirst: true })

  if (queryError) {
    console.error('Sleeping items query error:', queryError)
    return NextResponse.json({ error: 'Failed to fetch sleeping items' }, { status: 500 })
  }

  return NextResponse.json({ garments: garments ?? [] })
}
