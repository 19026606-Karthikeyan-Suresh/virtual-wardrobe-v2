import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Garment } from '@/lib/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const category = searchParams.get('category')
  const color = searchParams.get('color')
  const vibe = searchParams.get('vibe')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  let query = supabase
    .from('garments')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (color) {
    // Filter by primary color prefix (e.g. '#3B' matches hex colors starting with that)
    query = query.ilike('color_primary', `${color}%`)
  }

  if (vibe) {
    // vibe is a text[] column — filter rows where the array contains the given value
    query = query.contains('vibe', [vibe])
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    garments: (data ?? []) as Garment[],
    total: count ?? 0,
  })
}
