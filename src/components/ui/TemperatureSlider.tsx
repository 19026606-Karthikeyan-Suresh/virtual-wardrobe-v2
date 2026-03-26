'use client'

import { useId } from 'react'

export interface TemperatureSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  className?: string
}

export function TemperatureSlider({
  min,
  max,
  value,
  onChange,
  className = '',
}: TemperatureSliderProps) {
  const id = useId()
  const [low, high] = value
  const range = max - min

  const lowPct = ((low - min) / range) * 100
  const highPct = ((high - min) / range) * 100

  function handleLow(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Math.min(Number(e.target.value), high - 1)
    onChange([next, high])
  }

  function handleHigh(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Math.max(Number(e.target.value), low + 1)
    onChange([low, next])
  }

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      {/* Value labels */}
      <div className="flex justify-between text-sm text-muted">
        <span aria-live="polite">{low}°C</span>
        <span aria-live="polite">{high}°C</span>
      </div>

      {/* Track + handles */}
      <div className="relative h-5 flex items-center" role="group" aria-label="Temperature range">
        {/* Full track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-surface-raised" />

        {/* Active range fill */}
        <div
          aria-hidden="true"
          className="absolute h-1.5 rounded-full bg-brand"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />

        {/* Low handle */}
        <input
          id={`${id}-low`}
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={handleLow}
          aria-label={`Minimum temperature, currently ${low}°C`}
          aria-valuemin={min}
          aria-valuemax={high - 1}
          aria-valuenow={low}
          className={[
            'absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent',
            'range-thumb:w-4 range-thumb:h-4 range-thumb:rounded-full',
            'range-thumb:bg-brand range-thumb:border-2 range-thumb:border-white',
            'range-thumb:shadow range-thumb:cursor-pointer',
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
          style={{ zIndex: low > max - 5 ? 5 : 3 }}
        />

        {/* High handle */}
        <input
          id={`${id}-high`}
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={handleHigh}
          aria-label={`Maximum temperature, currently ${high}°C`}
          aria-valuemin={low + 1}
          aria-valuemax={max}
          aria-valuenow={high}
          className={[
            'absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent',
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
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-muted">
        <span>{min}°C</span>
        <span>{max}°C</span>
      </div>
    </div>
  )
}
