--`users` table + trigger to auto-create profile on signup
-- When someone signs up via Supabase Auth, a row is created in auth.users.
-- This trigger automatically creates a matching row in our public.users table.
-- Depends on: auth.users (Supabase built-in)

CREATE TABLE public.users (
  id              UUID PRIMARY KEY,                    -- matches auth.users.id
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,                                -- Supabase Storage path
  location_lat    DECIMAL(9,6),                        -- for weather API
  location_lng    DECIMAL(9,6),
  vto_consent     BOOLEAN DEFAULT FALSE,               -- VTO data transmission consent
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
