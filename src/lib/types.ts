// ---------------------------------------------------------------------------
// Literal union types (derived from constants for use in props and schemas)
// ---------------------------------------------------------------------------

export type GarmentCategory =
  | 'Top'
  | 'Bottom'
  | 'Dress'
  | 'Shoes'
  | 'Accessory'
  | 'Outerwear'

export type GarmentVibe =
  | 'Casual'
  | 'Business'
  | 'Formal'
  | 'Streetwear'
  | 'Smart Casual'
  | 'Athleisure'

export type GarmentFabric =
  | 'Cotton'
  | 'Denim'
  | 'Silk'
  | 'Wool'
  | 'Polyester'
  | 'Linen'
  | 'Leather'
  | 'Synthetic'
  | 'Knit'
  | 'Chiffon'

export type OutfitOccasion =
  | 'Work'
  | 'Casual'
  | 'Wedding'
  | 'Date Night'
  | 'Formal'
  | 'Travel'
  | 'Gym'

// ---------------------------------------------------------------------------
// Core entity interfaces (match public.* Supabase tables)
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  location_lat: number | null
  location_lng: number | null
  vto_consent: boolean
  created_at: string
}

export interface Garment {
  id: string
  user_id: string
  name: string
  category: GarmentCategory
  color_primary: string // hex e.g. '#3B82F6'
  color_secondary: string | null
  fabric: GarmentFabric | null
  vibe: GarmentVibe[]
  warmth_level: number // 1–5
  purchase_price: number
  maintenance_cost: number | null //provide info to user on maintenance cost based on fabric type
  times_worn: number
  last_worn_at: string | null // ISO date
  image_path: string //Supabase storage path, not a full URL
  thumb_path: string
  is_active: boolean
  created_at: string
}

export interface Outfit {
  id: string
  user_id: string
  name: string
  occasion: OutfitOccasion | null
  weather_min_temp: number | null
  weather_max_temp: number | null
  preview_path: string | null
  is_favourite: boolean
  created_at: string
}

export interface OutfitGarment {
  outfit_id: string
  garment_id: string
  position: number
}

export interface DailyLog {
  id: string
  user_id: string
  outfit_id: string | null
  logged_date: string // ISO date
  notes: string | null
  created_at: string
}

export interface VTOResult {
  id: string
  user_id: string
  garment_id: string
  source_photo_path: string
  result_path: string
  api_provider: 'huggingface' | 'gemini' | 'fashn'
  generation_ms: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Computed / joined types
// ---------------------------------------------------------------------------
//Cost per wear
export interface GarmentWithCPW extends Garment {
  cpw: number // (purchase_price + maintenance_cost) / times_worn
}

//All garments in an outfit
export interface OutfitWithGarments extends Outfit {
  garments: Garment[]
}

//Daily outfit logs
export interface DailyLogWithOutfit extends DailyLog {
  outfit: OutfitWithGarments | null
}

//Suggested outfit logs
export interface SuggestedOutfit {
  garments: Garment[]
  score: number
  colour_harmony: 'complementary' | 'analogous' | 'monochromatic' | 'neutral'
  weather_suitable: boolean
}

//Garment tagging from gemini
export interface GarmentTagResult {
  category: GarmentCategory
  color_primary: string
  color_secondary: string | null
  fabric: GarmentFabric | null
  vibe: GarmentVibe[]
  warmth_level: number
  suggested_name: string
}

//Detect multiple garments with bounding box to seperate them
//Will send back to garmentTagResult to classify the garment
export interface DetectedGarment {
  label: string //To show user what was found
  category: GarmentCategory //To show user what category of cloth was found
  bbox: { x: number; y: number; width: number; height: number }
}
