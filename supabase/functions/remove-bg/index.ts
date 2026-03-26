// Supabase Edge Function — remove-bg
// Deno runtime. Accepts a raw image buffer, removes the background using Sharp,
// and returns a PNG with a transparent background.
//
// Called by: POST /api/garments/upload (Next.js API route)
// Auth: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>

// @deno-types="npm:@types/sharp"
import sharp from 'npm:sharp@0.33.5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const buffer = await req.arrayBuffer()
    if (buffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'Empty body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const input = Buffer.from(buffer)

    // ------------------------------------------------------------------
    // Background removal via Sharp (threshold-based approach):
    //
    // 1. Extract the raw pixel data as greyscale to build an alpha mask.
    // 2. Pixels brighter than the threshold (near-white) become transparent.
    // 3. Composite the mask back onto the original image as the alpha channel.
    // ------------------------------------------------------------------
    const image = sharp(input)
    const { width, height } = await image.metadata()

    if (!width || !height) {
      return new Response(JSON.stringify({ error: 'Invalid image' }), {
        status: 422,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Build alpha mask: invert greyscale so white → 0 (transparent), dark → 255 (opaque)
    const maskBuffer = await sharp(input)
      .greyscale()
      .negate()           // white pixels become black (0) in the mask
      .threshold(30)      // pixels within 30 of white become fully transparent
      .negate()           // re-invert: near-white → 0, everything else → 255
      .toBuffer()

    // Apply mask as alpha channel to original (ensure PNG for transparency support)
    const processed = await sharp(input)
      .ensureAlpha()
      .joinChannel(maskBuffer, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer()

    return new Response(processed, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/png',
        'Content-Length': String(processed.byteLength),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
