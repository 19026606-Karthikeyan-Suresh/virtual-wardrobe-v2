-- Make the garments bucket public so that getPublicUrl() works for image display.
-- Write operations (INSERT, UPDATE, DELETE) remain restricted by existing RLS policies.
UPDATE storage.buckets SET public = TRUE WHERE id = 'garments';
