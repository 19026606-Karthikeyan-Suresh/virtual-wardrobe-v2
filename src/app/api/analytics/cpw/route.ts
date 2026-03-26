import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCPW } from '@/lib/cpw'
import type { GarmentWithCPW } from '@/lib/types'

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

  // 2. Query active garments
  const { data: garments, error: queryError } = await supabase
    .from('garments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (queryError) {
    console.error('CPW query error:', queryError)
    return NextResponse.json({ error: 'Failed to fetch garments' }, { status: 500 })
  }

  // 3. Compute CPW and sort ascending (best value first)
  const withCPW = (garments ?? [])
    .map((g) => ({
      ...g,
      cpw: calculateCPW(g.purchase_price ?? 0, g.maintenance_cost ?? 0, g.times_worn ?? 0),
    }))
    .sort((a, b) => a.cpw - b.cpw)

  return NextResponse.json({ garments: withCPW })
}
