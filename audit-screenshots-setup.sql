-- ═══════════════════════════════════════════════════════════════════════
-- Audit Screenshots Setup
-- Run this in the Supabase SQL Editor BEFORE uploading any screenshots.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add screenshot_url column to website_audit_requests
ALTER TABLE website_audit_requests ADD COLUMN IF NOT EXISTS screenshot_url text;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Create the audit-screenshots storage bucket
--    (Skip if you already created it via the Supabase dashboard)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-screenshots',
  'audit-screenshots',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Storage RLS policies for audit-screenshots
-- ═══════════════════════════════════════════════════════════════════════

-- Allow anyone to upload (public audit form uses anon key)
DROP POLICY IF EXISTS "audit_screenshots_insert" ON storage.objects;
CREATE POLICY "audit_screenshots_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audit-screenshots');

-- Allow anyone to read/view (public URLs must be readable)
DROP POLICY IF EXISTS "audit_screenshots_select" ON storage.objects;
CREATE POLICY "audit_screenshots_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audit-screenshots');

-- Allow anyone to delete (admin panel deletes screenshots when record deleted)
DROP POLICY IF EXISTS "audit_screenshots_delete" ON storage.objects;
CREATE POLICY "audit_screenshots_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audit-screenshots');

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Enable realtime for website_audit_requests (skip if already added)
-- ═══════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'website_audit_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE website_audit_requests;
  END IF;
END $$;
