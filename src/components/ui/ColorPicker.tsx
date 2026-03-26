'use client'

import { useId, useRef, useState } from 'react'

export interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  className?: string
}

function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

export function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  const id = useId()
  const nativeRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)

  // Keep draft in sync when value changes from outside
  if (draft !== value && isValidHex(value)) {
    setDraft(value)
  }

  function commitDraft(raw: string) {
    const normalised = raw.startsWith('#') ? raw : `#${raw}`
    if (isValidHex(normalised)) {
      onChange(normalised)
      setDraft(normalised)
    } else {
      // Revert to last valid value
      setDraft(value)
    }
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      {/* Swatch — click opens native color picker */}
      <button
        type="button"
        aria-label="Open colour picker"
        onClick={() => nativeRef.current?.click()}
        className="w-8 h-8 rounded-lg border border-border shrink-0 focus:outline-none focus:ring-2 focus:ring-brand transition"
        style={{ backgroundColor: isValidHex(value) ? value : '#000000' }}
      />

      {/* Hidden native picker */}
      <input
        ref={nativeRef}
        id={`${id}-native`}
        type="color"
        value={isValidHex(value) ? value : '#000000'}
        onChange={handleNativeChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Text input */}
      <input
        id={id}
        type="text"
        value={draft}
        maxLength={7}
        aria-label="Hex colour code"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commitDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDraft((e.target as HTMLInputElement).value)
        }}
        placeholder="#000000"
        className={[
          'w-28 px-3 py-1.5 rounded-lg border border-border bg-background',
          'text-foreground text-sm font-mono',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'transition',
        ].join(' ')}
      />
    </div>
  )
}
