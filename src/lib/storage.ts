import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Sync URL helpers
// These construct URLs directly from env vars — no async client needed.
// ---------------------------------------------------------------------------

export function getPublicUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

export function getThumbUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/garments/${path}`
}

// ---------------------------------------------------------------------------
// Async Storage operations
// These use the server Supabase client — server-side only.
// Storage RLS requires paths of the form: {userId}/{filename}
// ---------------------------------------------------------------------------

/**
 * Upload a garment image to the `garments` bucket.
 * Returns the storage path (relative to the bucket) for both image and thumb.
 * Thumbnails are NOT separate files — they use URL transform params at render time,
 * so thumbPath === imagePath.
 */
export async function uploadGarmentImage(
  file: File | Blob,
  userId: string
): Promise<{ imagePath: string; thumbPath: string }> {
  const supabase = await createClient()
  const uuid = crypto.randomUUID()
  const imagePath = `${userId}/${uuid}.png`

  const { error } = await supabase.storage
    .from('garments')
    .upload(imagePath, file, {
      contentType: 'image/png',
      upsert: false,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  return { imagePath, thumbPath: imagePath }
}

/**
 * Delete a single object from any bucket.
 */
export async function deleteStorageAsset(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

/**
 * Generate a short-lived signed URL for a private bucket object.
 * Default expiry: 3600 seconds (1 hour).
 */
export async function generateSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message ?? 'unknown'}`)
  }

  return data.signedUrl
}
