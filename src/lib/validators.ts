import { z } from 'zod'
import { CATEGORIES, VIBES, FABRICS, OCCASIONS } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

const categoryEnum = z.enum(CATEGORIES)
const vibeEnum = z.enum(VIBES)
const fabricEnum = z.enum(FABRICS)
const occasionEnum = z.enum(OCCASIONS)

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour (e.g. #3B82F6)')

const warmthLevel = z.number().int().min(1).max(5)

// ---------------------------------------------------------------------------
// Garment schemas
// ---------------------------------------------------------------------------

/** Used for POST /api/garments — all required fields must be present */
export const createGarmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: categoryEnum,
  color_primary: hexColor,
  color_secondary: hexColor.nullable().optional(),
  fabric: fabricEnum.nullable().optional(),
  vibe: z.array(vibeEnum).min(1).max(3),
  warmth_level: warmthLevel,
  purchase_price: z.number().min(0).optional().default(0),
  maintenance_cost: z.number().min(0).optional().default(0),
  image_path: z.string().min(1, 'image_path is required'),
  thumb_path: z.string().min(1, 'thumb_path is required'),
})

/** Used for PATCH /api/garments/[id] — all fields optional */
export const updateGarmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: categoryEnum.optional(),
  color_primary: hexColor.optional(),
  color_secondary: hexColor.nullable().optional(),
  fabric: fabricEnum.nullable().optional(),
  vibe: z.array(vibeEnum).min(1).max(3).optional(),
  warmth_level: warmthLevel.optional(),
  purchase_price: z.number().min(0).optional(),
  maintenance_cost: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Outfit schemas
// ---------------------------------------------------------------------------

/** Used for POST /api/outfits */
export const createOutfitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  occasion: occasionEnum.nullable().optional(),
  weather_min_temp: z.number().int().min(-60).max(60).nullable().optional(),
  weather_max_temp: z.number().int().min(-60).max(60).nullable().optional(),
  garment_ids: z.array(z.string().uuid()).min(1, 'At least one garment required'),
  positions: z.array(z.number().int().min(0)).optional(),
  is_favourite: z.boolean().optional().default(false),
})

/** Used for PATCH /api/outfits/[id] */
export const updateOutfitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  occasion: occasionEnum.nullable().optional(),
  weather_min_temp: z.number().int().min(-60).max(60).nullable().optional(),
  weather_max_temp: z.number().int().min(-60).max(60).nullable().optional(),
  garment_ids: z.array(z.string().uuid()).min(1).optional(),
  positions: z.array(z.number().int().min(0)).optional(),
  is_favourite: z.boolean().optional(),
  preview_path: z.string().nullable().optional(),
})

// ---------------------------------------------------------------------------
// Daily log schema
// ---------------------------------------------------------------------------

/** Used for POST /api/logs */
export const createDailyLogSchema = z.object({
  outfit_id: z.string().uuid('outfit_id must be a valid UUID').nullable(),
  notes: z.string().max(500).nullable().optional(),
})

// ---------------------------------------------------------------------------
// VTO schemas
// ---------------------------------------------------------------------------

/** Used for POST /api/vto/generate */
export const vtoGenerateSchema = z.object({
  garment_id: z.string().uuid('garment_id must be a valid UUID'),
  source_photo_path: z.string().min(1, 'source_photo_path is required'),
})

// ---------------------------------------------------------------------------
// Resale listing schema
// ---------------------------------------------------------------------------

/** Used for POST /api/analytics/resale-listing */
export const resaleListingSchema = z.object({
  garment_id: z.string().uuid('garment_id must be a valid UUID'),
})

// ---------------------------------------------------------------------------
// Garment tagging schemas
// ---------------------------------------------------------------------------

/** Used by POST /api/garments/tag — request body */
export const tagGarmentBodySchema = z.object({
  imagePath: z.string().min(1, 'imagePath is required'),
})

/** Validates the AI-returned tag object from Gemini */
export const garmentTagResultSchema = z.object({
  category: categoryEnum,
  color_primary: hexColor,
  color_secondary: hexColor.nullable(),
  fabric: fabricEnum.nullable(),
  vibe: z.array(vibeEnum).min(1).max(3),
  warmth_level: warmthLevel,
  suggested_name: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Garment detection schemas
// ---------------------------------------------------------------------------

const bboxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
})

export const detectedGarmentSchema = z.object({
  label: z.string().min(1),
  category: categoryEnum,
  bbox: bboxSchema,
})

export const detectedGarmentsResponseSchema = z.object({
  items: z.array(detectedGarmentSchema),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateGarmentInput = z.infer<typeof createGarmentSchema>
export type UpdateGarmentInput = z.infer<typeof updateGarmentSchema>
export type CreateOutfitInput = z.infer<typeof createOutfitSchema>
export type UpdateOutfitInput = z.infer<typeof updateOutfitSchema>
export type CreateDailyLogInput = z.infer<typeof createDailyLogSchema>
export type VTOGenerateInput = z.infer<typeof vtoGenerateSchema>
export type ResaleListingInput = z.infer<typeof resaleListingSchema>
export type TagGarmentBody = z.infer<typeof tagGarmentBodySchema>
