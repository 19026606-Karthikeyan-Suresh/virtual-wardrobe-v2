import { Client, handle_file } from '@gradio/client'
import { VTO_TIMEOUT_MS } from '@/lib/constants'

export class VTOError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VTOError'
  }
}

const HF_SPACE = 'yisol/IDM-VTON'

export async function generateVTO(
  modelImageUrl: string,
  garmentImageUrl: string,
): Promise<{ resultUrl: string; generationMs: number }> {
  const started = Date.now()

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new VTOError(`VTO timed out after ${VTO_TIMEOUT_MS}ms`)),
      VTO_TIMEOUT_MS,
    ),
  )

  try {
    const hfToken = process.env.HF_TOKEN
    const app = await Client.connect(HF_SPACE, {
      ...(hfToken ? { token: hfToken as `hf_${string}` } : {}),
    })

    const result = await Promise.race([
      app.predict('/tryon', [
        // dict: model/person image with editor layer format
        { background: handle_file(modelImageUrl), layers: [], composite: null },
        // garm_img: garment image
        handle_file(garmentImageUrl),
        // garment_des: text description (empty = auto)
        '',
        // is_checked: use auto-generated mask
        true,
        // is_checked_crop: auto crop & resize
        true,
        // denoise_steps
        30,
        // seed
        42,
      ]),
      timeout,
    ])

    const generationMs = Date.now() - started

    // IDM-VTON returns [output_image, mask_image]
    // Each is either a { url: string } object or a filepath string
    const data = result.data as unknown[]
    const outputEntry = data[0]

    let resultUrl: string | undefined
    if (outputEntry && typeof outputEntry === 'object' && 'url' in outputEntry) {
      resultUrl = (outputEntry as { url: string }).url
    } else if (typeof outputEntry === 'string') {
      resultUrl = outputEntry
    }

    if (!resultUrl) {
      throw new VTOError('No result image returned from IDM-VTON')
    }

    return { resultUrl, generationMs }
  } catch (err) {
    if (err instanceof VTOError) throw err

    throw new VTOError(
      err instanceof Error ? err.message : 'VTO generation failed',
    )
  }
}
