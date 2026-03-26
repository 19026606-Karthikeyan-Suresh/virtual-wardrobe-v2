-- `outfits` + `outfit_garments` junction table
-- Depends on: 001_create_users.sql, 002_create_garments.sql

CREATE TABLE public.outfits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  occasion         TEXT,                                -- Work|Casual|Wedding|Date Night|Formal|etc
  weather_min_temp SMALLINT,                            -- min temp in °C this outfit suits
  weather_max_temp SMALLINT,                            -- max temp in °C this outfit suits
  preview_path     TEXT,                                -- Supabase Storage path of flat-lay collage
  is_favourite     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outfits_user ON public.outfits(user_id);

-- Junction table: many-to-many between outfits and garments
CREATE TABLE public.outfit_garments (
  outfit_id   UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  garment_id  UUID NOT NULL REFERENCES public.garments(id) ON DELETE CASCADE,
  position    SMALLINT DEFAULT 0,                       -- z-index / render order on canvas
  PRIMARY KEY (outfit_id, garment_id)
);
