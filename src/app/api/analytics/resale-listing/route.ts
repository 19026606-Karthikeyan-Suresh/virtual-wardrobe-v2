import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { resaleListingSchema } from '@/lib/validators'
import { generateSignedUrl } from '@/lib/storage'

const resaleResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey)
}

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

  // 2. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = resaleListingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { garment_id } = parsed.data

  // 3. Fetch garment (scoped to current user)
  const { data: garment, error: garmentError } = await supabase
    .from('garments')
    .select('*')
    .eq('id', garment_id)
    .eq('user_id', user.id)
    .single()

  if (garmentError || !garment) {
    return NextResponse.json({ error: 'Garment not found' }, { status: 404 })
  }

  // 4. Generate resale listing via Gemini
  try {
    // Signed URL + image bytes
    const signedUrl = await generateSignedUrl('garments', garment.image_path, 300)
    const imageResponse = await fetch(signedUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch garment image: ${imageResponse.status}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') ?? 'image/png'

    const prompt = `You are a resale marketplace copywriter. Based on the garment image and these details:
- Name: ${garment.name}
- Category: ${garment.category}
- Fabric: ${garment.fabric ?? 'unknown'}
- Style: ${Array.isArray(garment.vibe) ? garment.vibe.join(', ') : garment.vibe}
- Primary colour: ${garment.color_primary}${garment.color_secondary ? `, secondary: ${garment.color_secondary}` : ''}

Write a resale listing. Return ONLY a JSON object with no markdown fences:
{
  "title": "short punchy listing title, max 60 characters",
  "description": "2-3 sentence product description mentioning fabric, style, and condition (assume good condition)"
}`

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: base64Image,
        },
      },
    ])

    const rawText = result.response.text().trim()

    let rawParsed: unknown
    try {
      rawParsed = JSON.parse(rawText)
    } catch {
      throw new Error('Gemini returned non-JSON response')
    }

    const validation = resaleResponseSchema.safeParse(rawParsed)
    if (!validation.success) {
      throw new Error(`Gemini response failed validation: ${validation.error.message}`)
    }

    return NextResponse.json({ title: validation.data.title, description: validation.data.description })
  } catch (err) {
    console.error('Resale listing generation error:', err)
    return NextResponse.json({ error: 'Listing generation service unavailable' }, { status: 502 })
  }
}
