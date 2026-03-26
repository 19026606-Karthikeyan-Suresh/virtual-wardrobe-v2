'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { CATEGORIES, FABRICS, VIBES, WARMTH_LEVELS } from '@/lib/constants'
import type { Garment, GarmentCategory, GarmentFabric, GarmentVibe } from '@/lib/types'

interface TagEditFormProps {
  garment: Garment
  onSave: (updated: Garment) => void
  onCancel: () => void
}

interface FormErrors {
  name?: string
  vibe?: string
}

export function TagEditForm({ garment, onSave, onCancel }: TagEditFormProps) {
  const [name, setName] = useState(garment.name)
  const [category, setCategory] = useState<GarmentCategory>(garment.category)
  const [colorPrimary, setColorPrimary] = useState(garment.color_primary)
  const [hasSecondaryColor, setHasSecondaryColor] = useState(garment.color_secondary !== null)
  const [colorSecondary, setColorSecondary] = useState(garment.color_secondary ?? '#ffffff')
  const [fabric, setFabric] = useState<GarmentFabric | ''>(garment.fabric ?? '')
  const [vibe, setVibe] = useState<GarmentVibe[]>(garment.vibe as GarmentVibe[])
  const [warmthLevel, setWarmthLevel] = useState(garment.warmth_level)
  const [purchasePrice, setPurchasePrice] = useState(String(garment.purchase_price))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function toggleVibe(v: GarmentVibe) {
    setVibe((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Name is required'
    if (vibe.length === 0) next.vibe = 'Select at least one vibe'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const body: Partial<Garment> = {
        name: name.trim(),
        category,
        color_primary: colorPrimary,
        color_secondary: hasSecondaryColor ? colorSecondary : null,
        fabric: fabric !== '' ? fabric : null,
        vibe,
        warmth_level: warmthLevel,
        purchase_price: parseFloat(purchasePrice) || 0,
      }

      const res = await fetch(`/api/garments/${garment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to update garment')

      const { garment: updated } = (await res.json()) as { garment: Garment }
      onSave(updated)
    } catch {
      setSubmitError('Failed to save changes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const warmthLabel = WARMTH_LEVELS.find((w) => w.value === warmthLevel)?.label ?? ''

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name */}
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="e.g. Blue Linen Shirt"
      />

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GarmentCategory)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Primary colour */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Primary colour</label>
        <ColorPicker value={colorPrimary} onChange={setColorPrimary} />
      </div>

      {/* Secondary colour */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={hasSecondaryColor}
            onChange={(e) => setHasSecondaryColor(e.target.checked)}
            className="w-4 h-4 rounded accent-brand"
          />
          Secondary colour
        </label>
        {hasSecondaryColor && (
          <ColorPicker value={colorSecondary} onChange={setColorSecondary} />
        )}
      </div>

      {/* Fabric */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Fabric</label>
        <select
          value={fabric}
          onChange={(e) => setFabric(e.target.value as GarmentFabric | '')}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
        >
          <option value="">Unknown</option>
          {FABRICS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Vibe */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Vibe</label>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleVibe(v as GarmentVibe)}
              aria-pressed={vibe.includes(v as GarmentVibe)}
              className={[
                'px-3 py-1 rounded-full text-sm font-medium border transition focus:outline-none focus:ring-2 focus:ring-brand',
                vibe.includes(v as GarmentVibe)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-background text-muted border-border hover:border-brand hover:text-foreground',
              ].join(' ')}
            >
              {v}
            </button>
          ))}
        </div>
        {errors.vibe && <p className="text-xs text-red-500">{errors.vibe}</p>}
      </div>

      {/* Warmth level */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Warmth — <span className="font-normal text-muted">{warmthLabel}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={warmthLevel}
          onChange={(e) => setWarmthLevel(Number(e.target.value))}
          aria-label={`Warmth level, currently ${warmthLevel}: ${warmthLabel}`}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={warmthLevel}
          className={[
            'w-full h-1.5 appearance-none rounded-full bg-surface-raised accent-brand',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
            '[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
            '[&::-moz-range-thumb]:cursor-pointer',
          ].join(' ')}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>1 — Sheer</span>
          <span>5 — Heavy winter</span>
        </div>
      </div>

      {/* Purchase price */}
      <Input
        label="Purchase price ($)"
        type="number"
        value={purchasePrice}
        onChange={(e) => setPurchasePrice(e.target.value)}
        placeholder="0.00"
      />

      {submitError && (
        <p className="text-xs text-red-500 text-center">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="flex-1"
        >
          Save
        </Button>
      </div>
    </form>
  )
}
