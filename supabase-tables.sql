-- ═══════════════════════════════════════════════════════════
-- Ascendra Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- Note: "CREATE POLICY IF NOT EXISTS" is not valid PostgreSQL.
--       Use DROP POLICY IF EXISTS first, then CREATE POLICY.
-- ═══════════════════════════════════════════════════════════


-- ── 1. contact_submissions ───────────────────────────────
-- Receives: Book Strategy Call form (contact.html)
-- Read by:  Admin CRM & Leads (crm-leads.html)

CREATE TABLE IF NOT EXISTS contact_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text,
  business      text,
  email         text,
  phone         text,
  source        text DEFAULT 'Contact Form',
  goals         text,
  status        text DEFAULT 'new',
  value         numeric,
  role          text,
  industry      text,
  notes         text,
  project_type  text,
  budget        text,
  timeline      text,
  created_at    timestamptz DEFAULT now()
);

-- Add columns if the table already exists without them
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS timeline text;

-- RLS: allow anon read/write
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "anon_insert_contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "anon_update_contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "anon_delete_contact_submissions" ON contact_submissions;

CREATE POLICY "anon_select_contact_submissions"
  ON contact_submissions FOR SELECT USING (true);

CREATE POLICY "anon_insert_contact_submissions"
  ON contact_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_contact_submissions"
  ON contact_submissions FOR UPDATE USING (true);

CREATE POLICY "anon_delete_contact_submissions"
  ON contact_submissions FOR DELETE USING (true);


-- ── 2. quote_leads ───────────────────────────────────────
-- Receives: Quote Calculator form (quote.html)
-- Read by:  Admin Quote Requests (quote-requests.html)

CREATE TABLE IF NOT EXISTS quote_leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text,
  business          text,
  email             text,
  phone             text,
  project_type      text,
  industry          text,
  package_selected  text,
  estimated_min     numeric,
  estimated_max     numeric,
  status            text DEFAULT 'new',
  notes             text,
  created_at        timestamptz DEFAULT now()
);

-- Add missing columns if the table already exists without them
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS features text;
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS timeline text;
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS budget text;

-- RLS
ALTER TABLE quote_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_quote_leads" ON quote_leads;
DROP POLICY IF EXISTS "anon_insert_quote_leads" ON quote_leads;
DROP POLICY IF EXISTS "anon_update_quote_leads" ON quote_leads;
DROP POLICY IF EXISTS "anon_delete_quote_leads" ON quote_leads;

CREATE POLICY "anon_select_quote_leads"
  ON quote_leads FOR SELECT USING (true);

CREATE POLICY "anon_insert_quote_leads"
  ON quote_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_quote_leads"
  ON quote_leads FOR UPDATE USING (true);

CREATE POLICY "anon_delete_quote_leads"
  ON quote_leads FOR DELETE USING (true);


-- ── 3. messages ──────────────────────────────────────────
-- Receives: Send Us a Message form (contact.html)
-- Read by:  Admin Messages (messages.html)

CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text,
  business_name text,
  email         text,
  phone         text,
  subject       text,
  message       text,
  source        text DEFAULT 'website',
  is_read       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
DROP POLICY IF EXISTS "anon_update_messages" ON messages;
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;

CREATE POLICY "anon_select_messages"
  ON messages FOR SELECT USING (true);

CREATE POLICY "anon_insert_messages"
  ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_messages"
  ON messages FOR UPDATE USING (true);

CREATE POLICY "anon_delete_messages"
  ON messages FOR DELETE USING (true);


-- ── 4. website_audit_requests ────────────────────────────
-- Receives: Free Website Audit form (contact.html)
-- Read by:  Admin Website Audits (website-audits.html)

CREATE TABLE IF NOT EXISTS website_audit_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text,
  business_name text,
  email         text,
  phone         text,
  website_url   text,
  budget        text,
  timeline      text,
  goals         text,
  features      text,
  notes         text,
  status        text DEFAULT 'new',
  created_at    timestamptz DEFAULT now()
);

-- Add columns if the table already exists without them
ALTER TABLE website_audit_requests ADD COLUMN IF NOT EXISTS features text;
ALTER TABLE website_audit_requests ADD COLUMN IF NOT EXISTS notes text;

-- RLS
ALTER TABLE website_audit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_website_audit_requests" ON website_audit_requests;
DROP POLICY IF EXISTS "anon_insert_website_audit_requests" ON website_audit_requests;
DROP POLICY IF EXISTS "anon_update_website_audit_requests" ON website_audit_requests;
DROP POLICY IF EXISTS "anon_delete_website_audit_requests" ON website_audit_requests;

CREATE POLICY "anon_select_website_audit_requests"
  ON website_audit_requests FOR SELECT USING (true);

CREATE POLICY "anon_insert_website_audit_requests"
  ON website_audit_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_website_audit_requests"
  ON website_audit_requests FOR UPDATE USING (true);

CREATE POLICY "anon_delete_website_audit_requests"
  ON website_audit_requests FOR DELETE USING (true);


-- ── 5. projects_content ──────────────────────────────────────
-- Managed by: Admin Website Content (website-content.html)
-- Read by:    Public Projects page (projects.html)
-- Purpose:    CMS for project cards and case studies

CREATE TABLE IF NOT EXISTS projects_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  industry       text,
  category_label text,
  project_type   text DEFAULT 'concept', -- 'concept' | 'real'
  status         text DEFAULT 'published', -- 'published' | 'draft'
  challenge      text,
  solution       text,
  metrics        jsonb DEFAULT '[]'::jsonb, -- [{value, label}]
  tags           jsonb DEFAULT '[]'::jsonb, -- ["Website", "Automation", …]
  footer_note    text,
  image_url      text,
  sort_order     integer DEFAULT 0,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE projects_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects_content" ON projects_content;
DROP POLICY IF EXISTS "anon_insert_projects_content" ON projects_content;
DROP POLICY IF EXISTS "anon_update_projects_content" ON projects_content;
DROP POLICY IF EXISTS "anon_delete_projects_content" ON projects_content;

CREATE POLICY "anon_select_projects_content"
  ON projects_content FOR SELECT USING (true);

CREATE POLICY "anon_insert_projects_content"
  ON projects_content FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_projects_content"
  ON projects_content FOR UPDATE USING (true);

CREATE POLICY "anon_delete_projects_content"
  ON projects_content FOR DELETE USING (true);


-- ── 6. website_content ───────────────────────────────────────
-- Managed by: Admin Website Content (website-content.html)
-- Read by:    All public pages
-- Purpose:    Key-value CMS for editable page text and copy

CREATE TABLE IF NOT EXISTS website_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key  text UNIQUE NOT NULL, -- e.g. 'hero_headline', 'cta_primary'
  content_json text,                  -- JSON blob for flexible field storage
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_website_content" ON website_content;
DROP POLICY IF EXISTS "anon_insert_website_content" ON website_content;
DROP POLICY IF EXISTS "anon_update_website_content" ON website_content;
DROP POLICY IF EXISTS "anon_delete_website_content" ON website_content;

CREATE POLICY "anon_select_website_content"
  ON website_content FOR SELECT USING (true);

CREATE POLICY "anon_insert_website_content"
  ON website_content FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_website_content"
  ON website_content FOR UPDATE USING (true);

CREATE POLICY "anon_delete_website_content"
  ON website_content FOR DELETE USING (true);


-- ── 7. media_uploads ─────────────────────────────────────────
-- Managed by: Admin Website Content (website-content.html)
-- Purpose:    Tracks uploaded project/media files
-- Note:       Files themselves live in Supabase Storage bucket 'project-images'

CREATE TABLE IF NOT EXISTS media_uploads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name   text,
  storage_path text,
  public_url  text,
  linked_to   text, -- 'project:<id>' | 'section:<key>' | NULL
  file_size   integer,
  mime_type   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_media_uploads" ON media_uploads;
DROP POLICY IF EXISTS "anon_insert_media_uploads" ON media_uploads;
DROP POLICY IF EXISTS "anon_update_media_uploads" ON media_uploads;
DROP POLICY IF EXISTS "anon_delete_media_uploads" ON media_uploads;

CREATE POLICY "anon_select_media_uploads"
  ON media_uploads FOR SELECT USING (true);

CREATE POLICY "anon_insert_media_uploads"
  ON media_uploads FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_media_uploads"
  ON media_uploads FOR UPDATE USING (true);

CREATE POLICY "anon_delete_media_uploads"
  ON media_uploads FOR DELETE USING (true);

-- ── 8. push_subscriptions ────────────────────────────────────────
-- Stores Web Push subscriptions for the admin PWA.
-- One row per browser/device. endpoint is unique per subscription.
-- Read/deleted by: Supabase Edge Function (notify-admin)
-- Written by:      Admin notifications.html (push subscribe flow)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    text        UNIQUE NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  user_agent  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "anon_insert_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "anon_update_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "anon_delete_push_subscriptions" ON push_subscriptions;

CREATE POLICY "anon_select_push_subscriptions"
  ON push_subscriptions FOR SELECT USING (true);

CREATE POLICY "anon_insert_push_subscriptions"
  ON push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_push_subscriptions"
  ON push_subscriptions FOR UPDATE USING (true);

CREATE POLICY "anon_delete_push_subscriptions"
  ON push_subscriptions FOR DELETE USING (true);


-- ── Supabase Storage bucket ───────────────────────────────────
-- Create a public bucket named 'project-images' in the Supabase
-- Storage dashboard (Storage → New bucket → Name: project-images → Public: ON).
-- This bucket stores uploaded project images/screenshots.
