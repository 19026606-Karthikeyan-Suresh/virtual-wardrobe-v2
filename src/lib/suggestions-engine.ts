import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { Garment, SuggestedOutfit } from '@/lib/types'
import { getCurrentWeather } from '@/lib/weather/open-meteo'
import {
  colourDistance,
  getComplementary,
  getAnalogous,
  getMonochromatic,
} from '@/lib/colour-theory'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getWarmthRange(temp_c: number): number[] {
  if (temp_c < 10) return [4, 5]
  if (temp_c < 18) return [3, 4]
  if (temp_c < 25) return [2, 3]
  return [1, 2]
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 90 // treat unworn items as 90 days ago for max boost
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function recencyBoost(garment: Garment): number {
  return Math.min(daysSince(garment.last_worn_at) * 0.1, 2)
}

type HarmonyLevel = SuggestedOutfit['colour_harmony']

function classifyHarmony(
  hex1: string,
  hex2: string,
): { level: HarmonyLevel; score: number } {
  const dist = colourDistance(hex1, hex2)
  const comp = getComplementary(hex1)
  const analogous = getAnalogous(hex1)
  const mono = getMonochromatic(hex1)

  if (colourDistance(comp, hex2) < 30) return { level: 'complementary', score: 3 }
  if (analogous.some((c) => colourDistance(c, hex2) < 30))
    return { level: 'analogous', score: 2 }
  if (mono.some((c) => colourDistance(c, hex2) < 30))
    return { level: 'monochromatic', score: 1 }
  // Neutral: colours are far apart but not in a named harmony
  void dist
  return { level: 'neutral', score: 0 }
}

interface Combo {
  garments: Garment[]
  score: number
  colour_harmony: HarmonyLevel
}

function scoreCombo(garments: Garment[]): Combo {
  let colourScore = 0
  let bestHarmony: HarmonyLevel = 'neutral'

  // Score every unique pair
  for (let i = 0; i < garments.length; i++) {
    for (let j = i + 1; j < garments.length; j++) {
      const { level, score } = classifyHarmony(
        garments[i].color_primary,
        garments[j].color_primary,
      )
      if (score > colourScore) {
        colourScore = score
        bestHarmony = level
      }
    }
  }

  const boost = garments.reduce((sum, g) => sum + recencyBoost(g), 0)
  return {
    garments,
    score: colourScore + boost,
    colour_harmony: bestHarmony,
  }
}

const MAX_CANDIDATES = 200

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateSuggestions(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<SuggestedOutfit[]> {
  // 1. Fetch user location
  const { data: userData } = await supabase
    .from('users')
    .select('location_lat, location_lng')
    .eq('id', userId)
    .single()

  if (!userData?.location_lat || !userData?.location_lng) {
    return []
  }

  // 2. Get current weather
  const { temp_c } = await getCurrentWeather(
    userData.location_lat,
    userData.location_lng,
  )

  // 3. Filter garments by appropriate warmth
  const warmthRange = getWarmthRange(temp_c)
  const { data: garments } = await supabase
    .from('garments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('warmth_level', warmthRange)

  if (!garments || garments.length === 0) return []

  // Cast DB rows to our typed Garment interface
  const typedGarments = garments as unknown as Garment[]

  // 4. Partition by category
  const tops = typedGarments.filter((g) => g.category === 'Top')
  const bottoms = typedGarments.filter((g) => g.category === 'Bottom')
  const dresses = typedGarments.filter((g) => g.category === 'Dress')
  const shoes = typedGarments.filter((g) => g.category === 'Shoes')
  const accessories = typedGarments.filter((g) => g.category === 'Accessory')
  const outerwear = typedGarments.filter((g) => g.category === 'Outerwear')

  if (shoes.length === 0) return []

  // 5. Build combos (cap at MAX_CANDIDATES)
  const candidates: Garment[][] = []

  outer: for (const shoe of shoes) {
    // Top + Bottom combos
    for (const top of tops) {
      for (const bottom of bottoms) {
        if (candidates.length >= MAX_CANDIDATES) break outer
        const base = [top, bottom, shoe]
        candidates.push(base)
        // Optional accessory
        if (accessories.length > 0) {
          candidates.push([...base, accessories[0]])
        }
        // Optional outerwear
        if (outerwear.length > 0) {
          candidates.push([...base, outerwear[0]])
        }
      }
    }
    // Dress combos (no bottom required)
    for (const dress of dresses) {
      if (candidates.length >= MAX_CANDIDATES) break outer
      const base = [dress, shoe]
      candidates.push(base)
      if (accessories.length > 0) {
        candidates.push([...base, accessories[0]])
      }
      if (outerwear.length > 0) {
        candidates.push([...base, outerwear[0]])
      }
    }
  }

  if (candidates.length === 0) return []

  // 6. Score and sort
  const scored = candidates
    .map(scoreCombo)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return scored.map((c) => ({
    garments: c.garments,
    score: c.score,
    colour_harmony: c.colour_harmony,
    weather_suitable: true,
  }))
}
