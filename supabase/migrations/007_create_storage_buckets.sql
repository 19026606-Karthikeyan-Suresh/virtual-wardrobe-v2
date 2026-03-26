-- Storage buckets (garments, avatars, vto-results) + storage RLS policies
-- Depends on: 001_create_users.sql (for auth.uid() scoping)

-- ============================================================
-- Buckets
-- ============================================================

-- garments bucket: private — background-removed images and thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'garments', -- ID (internal identifier)
  'garments', -- name (display name/path prefix)
  FALSE,      -- public whether anyone can access
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp'] -- file types that can be stored
)
ON CONFLICT (id) DO NOTHING;

-- avatars bucket: public — user profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,   -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- vto-results bucket: private — VTO reference photos and generated composites
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vto-results',
  'vto-results',
  FALSE,
  20971520,  -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies
-- Storage paths follow the pattern: {user_id}/{filename}
-- This ensures each user can only access their own files.
-- ============================================================

-- garments bucket policies
CREATE POLICY "Users can upload own garments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'garments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own garments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'garments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own garments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'garments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own garments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'garments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars bucket policies (public bucket — anyone can read, only owner can write)
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- vto-results bucket policies
CREATE POLICY "Users can upload own vto-results"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vto-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own vto-results"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vto-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own vto-results"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vto-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own vto-results"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vto-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
