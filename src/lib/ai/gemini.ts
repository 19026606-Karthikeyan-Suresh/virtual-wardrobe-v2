import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSignedUrl } from '@/lib/storage'
import { TAGGING_SYSTEM_PROMPT } from '@/lib/ai/tagging-prompt'
import { DETECTION_SYSTEM_PROMPT } from '@/lib/ai/detection-prompt'
import { garmentTagResultSchema, detectedGarmentsResponseSchema } from '@/lib/validators'
import type { GarmentTagResult, DetectedGarment } from '@/lib/types'

export type { GarmentTagResult, DetectedGarment }

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Tag a garment image using Gemini 2.0 Flash Vision.
 * Generates a signed URL for the Supabase Storage path, fetches the image,
 * sends it to Gemini with the tagging prompt, and returns validated tag data.
 */
export async function tagGarmentImage(imagePath: string): Promise<GarmentTagResult> {
  // 1. Get signed URL and fetch image bytes
  const signedUrl = await generateSignedUrl('garments', imagePath, 300)

  const imageResponse = await fetch(signedUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from Storage: ${imageResponse.status}`)
  }

  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  const mimeType = imageResponse.headers.get('content-type') ?? 'image/png'

  // 2. Call Gemini 2.5 Flash
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    { text: TAGGING_SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: base64Image,
      },
    },
  ])

  const rawText = result.response.text().trim()
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  // 3. Parse JSON response
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Gemini returned non-JSON response')
  }

  // 4. Validate with Zod schema — partial fallback on validation error
  const validation = garmentTagResultSchema.safeParse(parsed)

  if (validation.success) {
    return validation.data
  }

  // Partial fallback: return raw parsed object with safe defaults for failed fields
  console.warn('Gemini tag validation errors:', validation.error.issues)

  const raw = parsed as Record<string, unknown>

  return {
    category: garmentTagResultSchema.shape.category.safeParse(raw.category).success
      ? (raw.category as GarmentTagResult['category'])
      : 'Top',
    color_primary:
      typeof raw.color_primary === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.color_primary)
        ? raw.color_primary
        : '#000000',
    color_secondary:
      typeof raw.color_secondary === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.color_secondary)
        ? raw.color_secondary
        : null,
    fabric: garmentTagResultSchema.shape.fabric.safeParse(raw.fabric).success
      ? (raw.fabric as GarmentTagResult['fabric'])
      : null,
    vibe: Array.isArray(raw.vibe) && raw.vibe.length > 0
      ? (raw.vibe as GarmentTagResult['vibe'])
      : ['Casual'],
    warmth_level:
      typeof raw.warmth_level === 'number' && raw.warmth_level >= 1 && raw.warmth_level <= 5
        ? Math.round(raw.warmth_level)
        : 3,
    suggested_name: typeof raw.suggested_name === 'string' ? raw.suggested_name : 'Untitled Garment',
  }
}

/**
 * Detect multiple garments in an outfit photo using Gemini 2.5 Flash Vision.
 * Returns bounding boxes and labels for each detected clothing item.
 */
export async function detectGarmentsInImage(
  imageBase64: string,
  mimeType: string,
): Promise<DetectedGarment[]> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    { text: DETECTION_SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: imageBase64,
      },
    },
  ])

  const rawText = result.response.text().trim()
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Gemini returned non-JSON response for detection')
  }

  const validation = detectedGarmentsResponseSchema.safeParse(parsed)

  if (validation.success) {
    return validation.data.items
  }

  // Fallback: try to extract whatever items we can
  console.warn('Gemini detection validation errors:', validation.error.issues)
  const raw = parsed as Record<string, unknown>
  if (Array.isArray(raw.items)) {
    return raw.items
      .filter((item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && 'label' in item && 'bbox' in item
      )
      .map((item) => ({
        label: typeof item.label === 'string' ? item.label : 'Unknown item',
        category:
          garmentTagResultSchema.shape.category.safeParse(item.category).success
            ? (item.category as DetectedGarment['category'])
            : 'Top',
        bbox: {
          x: Number((item.bbox as Record<string, unknown>)?.x) || 0,
          y: Number((item.bbox as Record<string, unknown>)?.y) || 0,
          width: Number((item.bbox as Record<string, unknown>)?.width) || 0.5,
          height: Number((item.bbox as Record<string, unknown>)?.height) || 0.5,
        },
      }))
  }

  return []
}
