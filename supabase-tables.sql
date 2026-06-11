-- ═══════════════════════════════════════════════════════════
-- Ascendra Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ═══════════════════════════════════════════════════════════


-- ── 1. contact_submissions ───────────────────────────────
-- Receives: Book Strategy Call form (contact.html)
-- Read by:  Admin CRM & Leads (crm-leads.html)

CREATE TABLE IF NOT EXISTS contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  business    text,
  email       text,
  phone       text,
  source      text DEFAULT 'Contact Form',
  goals       text,
  status      text DEFAULT 'new',
  value       numeric,
  role        text,
  industry    text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- Add status column if the table already exists without it
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS notes text;

-- RLS: allow anon read/write (public form submissions + admin panel reads)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_select_contact_submissions"
  ON contact_submissions FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "anon_insert_contact_submissions"
  ON contact_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_update_contact_submissions"
  ON contact_submissions FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "anon_delete_contact_submissions"
  ON contact_submissions FOR DELETE USING (true);


-- ── 2. quote_leads ───────────────────────────────────────
-- Receives: Quote Calculator form (quote.html)
-- Read by:  Admin Quote Requests (quote-requests.html)

CREATE TABLE IF NOT EXISTS quote_leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Add status column if already exists without it
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- RLS
ALTER TABLE quote_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_select_quote_leads"
  ON quote_leads FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "anon_insert_quote_leads"
  ON quote_leads FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_update_quote_leads"
  ON quote_leads FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "anon_delete_quote_leads"
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

CREATE POLICY IF NOT EXISTS "anon_select_messages"
  ON messages FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "anon_insert_messages"
  ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_update_messages"
  ON messages FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "anon_delete_messages"
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
  status        text DEFAULT 'new',
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE website_audit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_select_website_audit_requests"
  ON website_audit_requests FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "anon_insert_website_audit_requests"
  ON website_audit_requests FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_update_website_audit_requests"
  ON website_audit_requests FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "anon_delete_website_audit_requests"
  ON website_audit_requests FOR DELETE USING (true);
