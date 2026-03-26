import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSuggestions } from '@/lib/suggestions-engine'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const outfits = await generateSuggestions(user.id, supabase)
    return NextResponse.json({ outfits })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: message },
      { status: 500 },
    )
  }
}
