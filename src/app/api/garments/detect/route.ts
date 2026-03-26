import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectGarmentsInImage } from '@/lib/ai/gemini'
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_MB } from '@/lib/constants'

const MAX_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

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

  // 2. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('image')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Accepted: ${ACCEPTED_IMAGE_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_UPLOAD_SIZE_MB} MB` },
      { status: 400 },
    )
  }

  // 3. Convert to base64 for Gemini
  const imageBuffer = await file.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')

  // 4. Call Gemini detection
  try {
    const items = await detectGarmentsInImage(base64Image, file.type)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No clothing items detected in the image. Try a clearer photo.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ items }, { status: 200 })
  } catch (err) {
    console.error('Garment detection error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Detection failed' },
      { status: 500 },
    )
  }
}
