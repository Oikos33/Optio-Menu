-- =====================================================
-- Migration 002: Tables (for per-table QR ordering)
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS tables (
  id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid      NOT NULL REFERENCES businesses ON DELETE CASCADE,
  name        text      NOT NULL,
  -- Unique token embedded in QR URL: /menu/{slug}?t={token}
  token       text      NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  capacity    int,
  section     text,     -- e.g. "Terrace", "Bar", "Indoor" – free-form label
  status      text      NOT NULL DEFAULT 'available'
              CHECK (status IN ('available', 'occupied', 'reserved', 'needs_cleaning')),
  is_active   boolean   NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can fully manage their own tables
CREATE POLICY "owners_manage_tables"
  ON tables FOR ALL
  TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Public (guests) can read active tables (needed to validate ?t= token at order time)
CREATE POLICY "public_read_active_tables"
  ON tables FOR SELECT
  TO public
  USING (is_active = true);

-- Index for fast token lookup (used at order time to identify the table)
CREATE INDEX IF NOT EXISTS idx_tables_token ON tables (token);
CREATE INDEX IF NOT EXISTS idx_tables_business_id ON tables (business_id);
