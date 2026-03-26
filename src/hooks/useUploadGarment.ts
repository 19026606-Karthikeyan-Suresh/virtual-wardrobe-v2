'use client'

import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Garment, GarmentTagResult } from '@/lib/types'

export type UploadStage = 'idle' | 'uploading' | 'processing' | 'tagging' | 'done' | 'error'

// Standalone upload function (usable outside hook for multi-file scenarios)
export async function uploadGarmentFile(
  file: File,
  onProgress: (pct: number) => void,
  onStageChange: (stage: UploadStage) => void
): Promise<{ garment: Garment; tags: GarmentTagResult }> {
  // 1. XHR upload
  onStageChange('uploading')
  const garment = await new Promise<Garment>((resolve, reject) => {
    const formData = new FormData()
    formData.append('image', file)
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.upload.onload = () => {
      onProgress(100)
      onStageChange('processing')
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText) as { garment: Garment }
        resolve(json.garment)
      } else {
        let msg = `Upload failed (${xhr.status})`
        try { msg = (JSON.parse(xhr.responseText) as { error: string }).error } catch { /* ignore */ }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.open('POST', '/api/garments/upload')
    xhr.send(formData)
  })

  // 2. Tag
  onStageChange('tagging')
  const tagRes = await fetch('/api/garments/tag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagePath: garment.image_path }),
  })
  if (!tagRes.ok) throw new Error('Tagging failed')
  const { tags } = (await tagRes.json()) as { tags: GarmentTagResult }

  onStageChange('done')
  return { garment, tags }
}

interface UseUploadGarmentReturn {
  upload: (file: File) => Promise<{ garment: Garment; tags: GarmentTagResult }>
  isLoading: boolean
  progress: number
  stage: UploadStage
  error: string | null
  reset: () => void
}

export function useUploadGarment(): UseUploadGarmentReturn {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<UploadStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const placeholderIdRef = useRef<string | null>(null)

  const reset = useCallback(() => {
    setProgress(0)
    setStage('idle')
    setError(null)
    placeholderIdRef.current = null
  }, [])

  const upload = useCallback(async (file: File) => {
    setError(null)
    setProgress(0)
    setStage('uploading')

    // Optimistic: inject placeholder
    const tempId = `placeholder-${Date.now()}-${Math.random()}`
    placeholderIdRef.current = tempId
    const filename = file.name.replace(/\.[^.]+$/, '')
    const placeholder: Garment = {
      id: tempId,
      user_id: '',
      name: filename,
      category: 'Top',
      color_primary: '#000000',
      color_secondary: null,
      fabric: null,
      vibe: [],
      warmth_level: 3,
      purchase_price: 0,
      maintenance_cost: 0,
      times_worn: 0,
      last_worn_at: null,
      image_path: '',
      thumb_path: '',
      is_active: true,
      created_at: new Date().toISOString(),
    }

    await queryClient.cancelQueries({ queryKey: ['garments'] })
    const snapshot = queryClient.getQueriesData<{ garments: Garment[]; total: number }>({ queryKey: ['garments'] })
    queryClient.setQueriesData<{ garments: Garment[]; total: number }>(
      { queryKey: ['garments'] },
      (old) => {
        if (!old) return old
        return { ...old, garments: [placeholder, ...old.garments], total: old.total + 1 }
      }
    )

    try {
      const result = await uploadGarmentFile(file, setProgress, setStage)
      await queryClient.invalidateQueries({ queryKey: ['garments'] })
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setStage('error')
      // Rollback optimistic update
      snapshot.forEach(([key, val]) => queryClient.setQueryData(key, val))
      throw err
    }
  }, [queryClient])

  const isLoading = stage === 'uploading' || stage === 'processing' || stage === 'tagging'

  return { upload, isLoading, progress, stage, error, reset }
}
