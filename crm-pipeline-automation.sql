-- ═══════════════════════════════════════════════════════════
-- Ascendra CRM Pipeline Automation Schema
-- Run this entire script in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════

-- ── crm_leads  (Unified Pipeline Table) ──────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking (links back to origin table)
  source               text NOT NULL DEFAULT 'manual',
  source_id            uuid,

  -- Contact info
  name                 text NOT NULL DEFAULT 'Unknown',
  business             text DEFAULT '',
  email                text DEFAULT '',
  phone                text DEFAULT '',

  -- Project details
  project_type         text DEFAULT '',
  budget               text DEFAULT '',
  budget_value         numeric DEFAULT 0,
  timeline             text DEFAULT '',

  -- Pipeline stage
  pipeline_stage       text NOT NULL DEFAULT 'quote_request',

  -- AI Qualification
  lead_score           integer DEFAULT 0,
  priority_flag        boolean DEFAULT false,
  qualification_status text DEFAULT 'pending',
  qualification_notes  text DEFAULT '',

  -- Proposal
  proposal_value       numeric,
  proposal_date        timestamptz,
  proposal_status      text,

  -- Client/Project
  client_name          text,
  project_name         text,

  -- Meta
  assigned_owner       text DEFAULT 'Doris Cacarl',
  status               text DEFAULT 'active',
  notes                text DEFAULT '',

  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Prevent duplicate CRM records from the same source row
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_source_id_uniq
  ON crm_leads (source_id)
  WHERE source_id IS NOT NULL;

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS crm_leads_updated_at ON crm_leads;
CREATE TRIGGER crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS (allow anon access — same pattern as other Ascendra tables)
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "anon_insert_crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "anon_update_crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "anon_delete_crm_leads" ON crm_leads;

CREATE POLICY "anon_select_crm_leads" ON crm_leads FOR SELECT USING (true);
CREATE POLICY "anon_insert_crm_leads" ON crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_crm_leads" ON crm_leads FOR UPDATE USING (true);
CREATE POLICY "anon_delete_crm_leads" ON crm_leads FOR DELETE USING (true);

-- Enable Realtime for live pipeline updates
ALTER PUBLICATION supabase_realtime ADD TABLE crm_leads;

-- Also add budget/timeline to quote_leads if missing
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE quote_leads ADD COLUMN IF NOT EXISTS timeline text;

-- Ensure notifications.related_id can hold a UUID string
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_table text;
