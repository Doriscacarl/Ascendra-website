-- ═══════════════════════════════════════════════════════════════
-- Ascendra Portfolio System — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── portfolio_projects ───────────────────────────────────────────
-- Powers the public portfolio section and admin Portfolio manager.

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  industry         TEXT NOT NULL DEFAULT 'other',
  category_label   TEXT,
  project_url      TEXT,
  short_description TEXT,
  long_description  TEXT,
  challenge        TEXT,
  solution         TEXT,
  hero_image       TEXT,
  gallery_images   JSONB DEFAULT '[]'::jsonb,
  features         JSONB DEFAULT '[]'::jsonb,
  results          JSONB DEFAULT '[]'::jsonb,
  technologies     JSONB DEFAULT '[]'::jsonb,
  testimonial_text TEXT,
  testimonial_author TEXT,
  testimonial_role TEXT,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured         BOOLEAN DEFAULT false,
  display_order    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portfolio_updated_at ON portfolio_projects;
CREATE TRIGGER portfolio_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_updated_at();

-- ── RLS (same anon-full-access pattern as other Ascendra tables) ──
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_portfolio"  ON portfolio_projects;
DROP POLICY IF EXISTS "anon_insert_portfolio"  ON portfolio_projects;
DROP POLICY IF EXISTS "anon_update_portfolio"  ON portfolio_projects;
DROP POLICY IF EXISTS "anon_delete_portfolio"  ON portfolio_projects;

CREATE POLICY "anon_select_portfolio"
  ON portfolio_projects FOR SELECT USING (true);

CREATE POLICY "anon_insert_portfolio"
  ON portfolio_projects FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_portfolio"
  ON portfolio_projects FOR UPDATE USING (true);

CREATE POLICY "anon_delete_portfolio"
  ON portfolio_projects FOR DELETE USING (true);

-- ── Storage bucket for portfolio images ───────────────────────────
-- MANUAL STEP: Go to Supabase → Storage → New Bucket
--   Name: portfolio-images
--   Public: YES (toggle on)
--
-- Then run these policies to allow anon uploads:
-- (Run after creating the bucket in the dashboard)

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "portfolio_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_images_anon_upload" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_images_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_images_anon_delete" ON storage.objects;

CREATE POLICY "portfolio_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "portfolio_images_anon_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-images');

CREATE POLICY "portfolio_images_anon_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "portfolio_images_anon_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-images');

-- ── Seed data — 3 starter projects ───────────────────────────────
-- These populate the homepage section and portfolio page immediately.
-- You can edit/delete these from the admin panel after setup.

INSERT INTO portfolio_projects
  (slug, name, industry, category_label, project_url,
   short_description, long_description, challenge, solution,
   features, results, technologies,
   testimonial_text, testimonial_author, testimonial_role,
   status, featured, display_order)
VALUES
(
  'djondjon',
  'Djondjon Restaurant',
  'restaurant',
  'Restaurant / Hospitality',
  '',
  'Luxury Haitian restaurant experience designed to elevate brand perception and simplify reservations.',
  'Djondjon is a premier Haitian restaurant that deserved a digital presence as exceptional as the dining experience it delivers. We engineered a complete growth system — immersive visual storytelling, automated reservations, and a full admin dashboard — that elevated the brand and eliminated booking friction overnight.',
  'The restaurant had no digital presence that reflected its luxury experience. Potential guests couldn''t easily reserve, there was no system to manage bookings, and the brand was invisible to online searchers in a competitive market.',
  'We designed and built a mobile-first luxury website with stunning visual storytelling, an integrated reservation system that eliminates manual booking, and a complete admin management panel so the team controls everything without touching code.',
  '["Mobile-first luxury design","Online reservation system","Premium visual storytelling","Admin management system","Menu showcase with photography","Guest communication automation"]'::jsonb,
  '[{"value":"+65%","label":"Direct Reservations"},{"value":"4.9★","label":"Guest Experience"},{"value":"–80%","label":"Booking Admin Time"},{"value":"$0","label":"Commission Fees"}]'::jsonb,
  '["Next.js","Supabase","Vercel","PWA"]'::jsonb,
  'Ascendra didn''t just build us a website — they built us a growth machine. Reservations are up and our team has never spent less time on admin.',
  'Chef Marie D.',
  'Owner, Djondjon Restaurant',
  'published', true, 1
),
(
  'prime-beauty',
  'Prime Beauty',
  'ecommerce',
  'Beauty / E-Commerce',
  '',
  'Premium beauty brand platform focused on mobile customer experience and modern online shopping.',
  'Prime Beauty had exceptional products and a loyal local following but zero online presence. We built a premium e-commerce platform that transformed their social media audience into paying customers — with a mobile-first shopping experience designed to convert.',
  'The brand was losing potential customers who discovered them on Instagram but had no easy path to purchase. They had no online store, no product management system, and no way to scale beyond walk-in customers.',
  'We designed and built a premium e-commerce platform with seamless mobile shopping, full product and inventory management, customer engagement automation, and a branded experience that matched the quality of the products themselves.',
  '["Product management system","Mobile-first shopping experience","Customer engagement & loyalty tools","Premium brand identity","Inventory tracking & alerts","Order confirmation automation"]'::jsonb,
  '[{"value":"+193%","label":"Monthly Revenue"},{"value":"4.1%","label":"Conversion Rate"},{"value":"+87%","label":"Mobile Orders"},{"value":"3.2×","label":"Avg Order Value"}]'::jsonb,
  '["React","Stripe","Supabase","Vercel"]'::jsonb,
  'Within 60 days of launch, our online revenue exceeded our in-store revenue. Ascendra built something we didn''t think was possible at our stage.',
  'Priya M.',
  'Founder, Prime Beauty',
  'published', true, 2
),
(
  'ascendra',
  'Ascendra',
  'agency',
  'Agency / Technology',
  'https://ascendra-website.vercel.app',
  'Growth-focused digital agency platform with AI-powered lead generation, CRM pipeline, and full automation.',
  'Ascendra''s own platform is the ultimate proof of concept — a live, fully operational growth system with AI-powered lead qualification, a real-time CRM pipeline, automated notifications, and a comprehensive admin dashboard. Every service we offer clients, we run ourselves.',
  'Building a platform that demonstrates our full capabilities while actually generating business required solving the same problems our clients face: lead capture, qualification, pipeline management, and conversion — at scale and without manual intervention.',
  'We engineered the complete Ascendra ecosystem: the luxury public website that builds trust and captures leads, the AI qualification engine that scores and routes them, the CRM pipeline that manages the full sales cycle, and the admin dashboard that gives total control from any device.',
  '["Website audit lead capture system","AI-powered lead qualification","7-stage CRM pipeline","Real-time push notifications","PWA mobile admin app","Quote calculator & ROI tools","Full analytics dashboard"]'::jsonb,
  '[{"value":"100+","label":"Leads Generated"},{"value":"3×","label":"Revenue Growth"},{"value":"24/7","label":"Automation Uptime"},{"value":"95%","label":"Client Satisfaction"}]'::jsonb,
  '["Next.js","Supabase","Vercel","AI Automation","n8n","PWA"]'::jsonb,
  'This is what we built for ourselves. Every client gets the same level of engineering, strategy, and craft.',
  'Doris Cacarl',
  'Principal Director, Ascendra',
  'published', false, 3
)
ON CONFLICT (slug) DO NOTHING;
