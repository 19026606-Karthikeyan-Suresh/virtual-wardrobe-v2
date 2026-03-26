import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadGarmentImage } from '@/lib/storage'
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_MB } from '@/lib/constants'
import type { Garment } from '@/lib/types'

const MAX_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

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

  // 2. Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  const imageField = formData.get('image')
  if (!imageField || !(imageField instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required field: image' },
      { status: 400 }
    )
  }

  const file = imageField as File

  // 3. Validate file type
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported media type. Accepted: ${ACCEPTED_IMAGE_TYPES.join(', ')}`,
      },
      { status: 415 }
    )
  }

  // 4. Validate file size
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB` },
      { status: 413 }
    )
  }

  // 5. Attempt remove-bg Edge Function (graceful fallback to original image)
  let processedBlob: Blob
  try {
    const imageBuffer = await file.arrayBuffer()
    const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/remove-bg`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    const bgResponse = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!bgResponse.ok) {
      const body = await bgResponse.text()
      console.warn('remove-bg unavailable, using original image:', bgResponse.status, body)
      processedBlob = file
    } else {
      processedBlob = await bgResponse.blob()
    }
  } catch (err) {
    console.warn('remove-bg fetch error, using original image:', err)
    processedBlob = file
  }

  // 6. Upload processed image to Supabase Storage
  let imagePath: string
  let thumbPath: string
  try {
    ;({ imagePath, thumbPath } = await uploadGarmentImage(processedBlob, user.id))
  } catch (err) {
    console.error('Storage upload error:', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }

  // 7. Insert garment row (placeholder metadata — caller PATCHes after AI tagging)
  const { data: garment, error: dbError } = await supabase
    .from('garments')
    .insert({
      user_id: user.id,
      name: 'Untitled Garment',
      category: 'Top',
      color_primary: '#000000',
      warmth_level: 3,
      vibe: [],
      image_path: imagePath,
      thumb_path: thumbPath,
    })
    .select()
    .single()

  if (dbError || !garment) {
    console.error('DB insert error:', dbError)
    // Best-effort: clean up the uploaded file
    try {
      await supabase.storage.from('garments').remove([imagePath])
    } catch {
      // non-fatal
    }
    return NextResponse.json({ error: 'Failed to save garment' }, { status: 500 })
  }

  return NextResponse.json({ garment: garment as Garment }, { status: 200 })
}
