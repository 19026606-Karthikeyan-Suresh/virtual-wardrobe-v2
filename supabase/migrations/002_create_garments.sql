-- `garments` table with indexes
-- Depends on: 001_create_users.sql

CREATE TABLE public.garments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,                      -- e.g. 'Blue Linen Shirt'
  category          TEXT NOT NULL,                      -- Top|Bottom|Dress|Shoes|Accessory|Outerwear
  color_primary     TEXT NOT NULL,                      -- hex code, e.g. '#3B82F6'
  color_secondary   TEXT,                               -- hex code if multi-toned
  fabric            TEXT,                               -- Cotton|Denim|Silk|Wool|Polyester|Linen|etc
  vibe              TEXT[] DEFAULT '{}',                 -- {Casual,Business,Formal,Streetwear,Smart Casual,Athleisure}
  warmth_level      SMALLINT CHECK (warmth_level BETWEEN 1 AND 5), -- 1=lightweight, 5=heavy winter
  purchase_price    DECIMAL(10,2) DEFAULT 0.00,
  maintenance_cost  DECIMAL(10,2) DEFAULT 0.00,         -- running total dry-cleaning/repair
  times_worn        INTEGER DEFAULT 0,                  -- incremented by daily_logs trigger
  last_worn_at      DATE,
  image_path        TEXT NOT NULL,                      -- Supabase Storage path: garments/{uuid}.png
  thumb_path        TEXT NOT NULL,                      -- Supabase Storage path: garments/{uuid}_thumb.png
  is_active         BOOLEAN DEFAULT TRUE,               -- FALSE = archived/listed for resale
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_garments_user     ON public.garments(user_id);
CREATE INDEX idx_garments_category ON public.garments(user_id, category);
CREATE INDEX idx_garments_active   ON public.garments(user_id, is_active);
