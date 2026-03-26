'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/Button'

interface ImageCropperProps {
  imageUrl: string
  onCropDone: (croppedBlob: Blob) => void
  onCancel: () => void
}

/**
 * Given a source image URL and a pixel crop area, returns a Blob of the cropped region.
 */
async function getCroppedImageBlob(
  imageSrc: string,
  crop: Area,
): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to load image for cropping'))
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/png',
      0.95,
    )
  })
}

export function ImageCropper({ imageUrl, onCropDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setIsCropping(true)
    try {
      const blob = await getCroppedImageBlob(imageUrl, croppedAreaPixels)
      onCropDone(blob)
    } catch {
      // fallback: use original
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      onCropDone(blob)
    } finally {
      setIsCropping(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Crop area */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted shrink-0" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-brand"
          aria-label="Zoom"
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted shrink-0" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
          Skip crop
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={handleConfirm}
          loading={isCropping}
        >
          Crop &amp; continue
        </Button>
      </div>
    </div>
  )
}
