// ---------------------------------------------------------------------------
// Internal hex ↔ HSL conversion helpers
// ---------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
    h = ((h * 60) % 360 + 360) % 360
  }

  return [h, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const a = sNorm * Math.min(lNorm, 1 - lNorm)

  const toChannel = (n: number): string => {
    const k = (n + h / 30) % 12
    const color = lNorm - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${toChannel(0)}${toChannel(8)}${toChannel(4)}`
}

// ---------------------------------------------------------------------------
// Exported colour harmony functions
// ---------------------------------------------------------------------------

/** Rotate hue 180° to get the complementary colour. */
export function getComplementary(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex((h + 180) % 360, s, l)
}

/** Rotate hue ±30° to get analogous colours. */
export function getAnalogous(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex)
  return [
    hslToHex(((h - 30) % 360 + 360) % 360, s, l),
    hslToHex((h + 30) % 360, s, l),
  ]
}

/** Same hue, vary saturation ±20% to get monochromatic variants. */
export function getMonochromatic(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex)
  return [
    hslToHex(h, Math.max(0, s - 20), l),
    hslToHex(h, Math.min(100, s + 20), l),
  ]
}

/** Rotate hue ±120° to get triadic colours. */
export function getTriadic(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex)
  return [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)]
}

/**
 * Delta E approximation in HSL space.
 * Returns a value roughly in the 0–100 range.
 * Lower = more similar colours.
 */
export function colourDistance(hex1: string, hex2: string): number {
  const [h1, s1, l1] = hexToHsl(hex1)
  const [h2, s2, l2] = hexToHsl(hex2)

  // Hue is circular — use shortest arc distance
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2))
  const ds = Math.abs(s1 - s2)
  const dl = Math.abs(l1 - l2)

  // Normalise hue component to 0–100 range before combining
  return Math.sqrt(((dh / 360) * 100) ** 2 + ds ** 2 + dl ** 2)
}

/** Returns true when the two colours are harmonious (Delta E < 30). */
export function isHarmoniousMatch(hex1: string, hex2: string): boolean {
  return colourDistance(hex1, hex2) < 30
}
