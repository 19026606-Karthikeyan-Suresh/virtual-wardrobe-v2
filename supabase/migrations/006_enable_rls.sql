-- Row-Level Security policies for all tables
-- Depends on: 001–005

-- ============================================================
-- users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own row"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can delete own row"
  ON public.users FOR DELETE
  USING (id = auth.uid());

-- ============================================================
-- garments
-- ============================================================
ALTER TABLE public.garments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own garments"
  ON public.garments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own garments"
  ON public.garments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own garments"
  ON public.garments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own garments"
  ON public.garments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- outfits
-- ============================================================
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own outfits"
  ON public.outfits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own outfits"
  ON public.outfits FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own outfits"
  ON public.outfits FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own outfits"
  ON public.outfits FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- outfit_garments
-- Scoped via join to outfits.user_id (no direct user_id column)
-- ============================================================
ALTER TABLE public.outfit_garments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own outfit_garments"
  ON public.outfit_garments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own outfit_garments"
  ON public.outfit_garments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own outfit_garments"
  ON public.outfit_garments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own outfit_garments"
  ON public.outfit_garments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- daily_logs
-- ============================================================
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs"
  ON public.daily_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own logs"
  ON public.daily_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own logs"
  ON public.daily_logs FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- vto_results
-- ============================================================
ALTER TABLE public.vto_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vto_results"
  ON public.vto_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vto_results"
  ON public.vto_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vto_results"
  ON public.vto_results FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own vto_results"
  ON public.vto_results FOR DELETE
  USING (user_id = auth.uid());
