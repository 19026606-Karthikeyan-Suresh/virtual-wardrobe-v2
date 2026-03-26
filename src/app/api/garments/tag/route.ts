import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tagGarmentBodySchema } from '@/lib/validators'
import { tagGarmentImage } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = tagGarmentBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { imagePath } = parsed.data

  // 3. Call Gemini tagging
  try {
    const tags = await tagGarmentImage(imagePath)
    return NextResponse.json({ tags }, { status: 200 })
  } catch (err) {
    console.error('Garment tagging error:', err)
    return NextResponse.json({ error: 'Tagging service unavailable' }, { status: 502 })
  }
}
