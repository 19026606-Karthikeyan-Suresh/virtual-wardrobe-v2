import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDailyLogSchema } from '@/lib/validators'
import type { DailyLogWithOutfit } from '@/lib/types'

type OutfitGarmentJoin = { position: number; garments: unknown }
type RawOutfit = { outfit_garments: OutfitGarmentJoin[] } & Record<string, unknown>
type RawLog = { outfit: RawOutfit | null } & Record<string, unknown>

function reshapeLog(raw: RawLog): DailyLogWithOutfit {
  const { outfit: rawOutfit, ...logFields } = raw
  if (!rawOutfit) {
    return { ...logFields, outfit: null } as unknown as DailyLogWithOutfit
  }
  const { outfit_garments, ...outfitFields } = rawOutfit
  return {
    ...logFields,
    outfit: {
      ...outfitFields,
      garments: (outfit_garments ?? [])
        .sort((a: OutfitGarmentJoin, b: OutfitGarmentJoin) => a.position - b.position)
        .map((og: OutfitGarmentJoin) => og.garments),
    },
  } as unknown as DailyLogWithOutfit
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start_date = searchParams.get('start_date') ?? '1970-01-01'
  const end_date = searchParams.get('end_date') ?? '9999-12-31'

  const { data: logs, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      outfit:outfits (
        *,
        outfit_garments (
          position,
          garments (*)
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('logged_date', start_date)
    .lte('logged_date', end_date)
    .order('logged_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result: DailyLogWithOutfit[] = (logs ?? []).map((log) =>
    reshapeLog(log as unknown as RawLog)
  )

  return NextResponse.json({ logs: result })
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

  const parsed = createDailyLogSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { outfit_id, notes } = parsed.data
  const logged_date = new Date().toISOString().split('T')[0]

  const { data: log, error: insertError } = await supabase
    .from('daily_logs')
    .insert({ user_id: user.id, outfit_id, notes: notes ?? null, logged_date })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Already logged today' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ log }, { status: 201 })
}
