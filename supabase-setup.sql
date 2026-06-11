-- ═══════════════════════════════════════════════════════════════
-- ASCENDRA NOTIFICATIONS TABLE SETUP
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nfowsobglotbjrdqsiid/sql/new
-- ═══════════════════════════════════════════════════════════════

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ   DEFAULT NOW() NOT NULL,
  type        TEXT          NOT NULL,          -- new_lead | new_quote | new_audit | new_message
  title       TEXT          NOT NULL,
  message     TEXT,
  status      TEXT          DEFAULT 'unread',  -- unread | read | archived
  related_table TEXT,
  related_id  TEXT
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (anon key used on public site + admin)
CREATE POLICY "anon_all" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for this table
-- (If it fails because already added, that's fine)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Also ensure Realtime is enabled on the other tables used by admin pages
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE contact_submissions;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE quote_leads;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE website_audit_requests;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN others THEN NULL;
END $$;
