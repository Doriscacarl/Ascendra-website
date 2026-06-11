-- ═══════════════════════════════════════════════════════════
-- Ascendra Invoices & Projects Tables
-- Run this in the Supabase SQL Editor AFTER crm-pipeline-automation.sql
-- ═══════════════════════════════════════════════════════════

-- ── invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  text,
  client          text NOT NULL,
  email           text DEFAULT '',
  amount          numeric NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'draft',
  issued          date,
  due             date,
  description     text DEFAULT '',
  crm_lead_id     uuid,
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- ── projects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  client       text DEFAULT '',
  status       text NOT NULL DEFAULT 'planning',
  progress     integer DEFAULT 0,
  start_date   date,
  due_date     date,
  value        numeric DEFAULT 0,
  notes        text DEFAULT '',
  crm_lead_id  uuid,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT USING (true);
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
