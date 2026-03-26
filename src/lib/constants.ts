//Garment categories
export const CATEGORIES = ["Top", "Bottom", "Dress", "Shoes", "Accessory", "Outerwear"] as const;

//Garment vibe
export const VIBES = [
  "Casual",
  "Business",
  "Formal",
  "Streetwear",
  "Smart Casual",
  "Athleisure",
] as const;

//Garment fabric type
export const FABRICS = [
  "Cotton",
  "Denim",
  "Silk",
  "Wool",
  "Polyester",
  "Linen",
  "Leather",
  "Synthetic",
  "Knit",
  "Chiffon",
] as const;

//Outfit occasions
export const OCCASIONS = [
  "Work",
  "Casual",
  "Wedding",
  "Date Night",
  "Formal",
  "Travel",
  "Gym",
] as const;

//Garment warmth level
export const WARMTH_LEVELS = [
  { value: 1, label: "Sheer / Lightweight", example: "tank top, chiffon blouse" },
  { value: 2, label: "Light", example: "t-shirt, linen shirt" },
  { value: 3, label: "Medium", example: "light jacket, blazer" },
  { value: 4, label: "Warm", example: "sweater, hoodie" },
  { value: 5, label: "Heavy Winter", example: "puffer coat, wool overcoat" },
] as const;

//Mark gaerments not worn for a number of days as "sleeping" to inform user
export const SLEEPING_THRESHOLD_DAYS = 90;

//Suggest garments not worn in a number of days to be worn again
export const WEAR_AGAIN_THRESHOLD_DAYS = 30;

//File validation
export const MAX_UPLOAD_SIZE_MB = 10;

//Accepted image types
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

//Accepeted thumbnail size
export const THUMBNAIL_SIZE = { width: 200, height: 200 } as const;

//Accepted VTO timeout for image generation
export const VTO_TIMEOUT_MS = 120_000; // 2 minutes — HF Spaces can queue
