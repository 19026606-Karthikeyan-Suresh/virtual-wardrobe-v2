-- `daily_logs` + wear-count increment trigger
-- Depends on: 001_create_users.sql, 002_create_garments.sql, 003_create_outfits.sql

CREATE TABLE public.daily_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  outfit_id   UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, logged_date)                          -- one log per user per day
);

-- Trigger: increment times_worn and update last_worn_at for each garment in the logged outfit
CREATE OR REPLACE FUNCTION public.increment_wear_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update wear counts if an outfit was logged
  IF NEW.outfit_id IS NOT NULL THEN
    UPDATE public.garments g
    SET
      times_worn   = g.times_worn + 1,
      last_worn_at = NEW.logged_date
    FROM public.outfit_garments og
    WHERE og.outfit_id  = NEW.outfit_id
      AND og.garment_id = g.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_wear_count
  AFTER INSERT ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_wear_count();

-- Trigger: placeholder for CPW cache invalidation on times_worn update
-- CPW is computed on read as (purchase_price + maintenance_cost) / times_worn.
-- This trigger exists per spec §3.8 and can be extended to a materialised cache later.
CREATE OR REPLACE FUNCTION public.update_cpw_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CPW is calculated on read; no separate column to update.
  -- Extend this function to populate a cpw_cache column if needed in a future migration.
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_cpw_cache
  AFTER UPDATE OF times_worn ON public.garments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cpw_cache();
