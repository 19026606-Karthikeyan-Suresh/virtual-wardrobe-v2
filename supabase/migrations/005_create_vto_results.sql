-- `vto_results` table
-- Depends on: 001_create_users.sql, 002_create_garments.sql

CREATE TABLE public.vto_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garment_id        UUID NOT NULL REFERENCES public.garments(id) ON DELETE CASCADE,
  source_photo_path TEXT NOT NULL,                      -- Supabase Storage path of user reference photo                            
  result_path       TEXT NOT NULL,                      -- Supabase Storage path of AI composite
  api_provider      TEXT NOT NULL,                      -- 'hugging face IDM-VTON'
  generation_ms     INTEGER,                            -- API response time for monitoring
  created_at        TIMESTAMPTZ DEFAULT now()           -- Time the vto was created
);

CREATE INDEX idx_vto_user ON public.vto_results(user_id);
