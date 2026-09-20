-- =====================================================
-- Migration 004: Phase 1 — Availability, Combos,
--                KDS PIN, Currency, Tipping, Profile
-- Run this in Supabase SQL Editor
-- =====================================================

-- ── 1. ITEM AVAILABILITY ─────────────────────────────────────────────────────

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_available      boolean   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_from    time,          -- e.g. '11:00'
  ADD COLUMN IF NOT EXISTS available_until   time,          -- e.g. '14:00'
  ADD COLUMN IF NOT EXISTS stock_count       int,           -- NULL = unlimited
  ADD COLUMN IF NOT EXISTS track_stock       boolean   NOT NULL DEFAULT false;

-- ── 2. COMBO / PACKAGE DEALS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS combo_deals (
  id           uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid      NOT NULL REFERENCES businesses ON DELETE CASCADE,
  name         jsonb     NOT NULL,
  description  jsonb,
  price        numeric(10,2),
  image_path   text,
  is_available boolean   NOT NULL DEFAULT true,
  sort_order   int       NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS combo_deal_items (
  combo_deal_id uuid NOT NULL REFERENCES combo_deals ON DELETE CASCADE,
  menu_item_id  uuid NOT NULL REFERENCES menu_items  ON DELETE CASCADE,
  quantity      int  NOT NULL DEFAULT 1,
  PRIMARY KEY (combo_deal_id, menu_item_id)
);

ALTER TABLE combo_deals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_deal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_manage_combos"
  ON combo_deals FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "public_read_combos"
  ON combo_deals FOR SELECT TO public USING (is_available = true);

CREATE POLICY "owners_manage_combo_items"
  ON combo_deal_items FOR ALL TO authenticated
  USING (combo_deal_id IN (
    SELECT id FROM combo_deals WHERE business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (combo_deal_id IN (
    SELECT id FROM combo_deals WHERE business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "public_read_combo_items"
  ON combo_deal_items FOR SELECT TO public USING (true);

-- ── 3. BUSINESS PROFILE ENRICHMENT ───────────────────────────────────────────

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS currency          text    NOT NULL DEFAULT 'JPY',
  ADD COLUMN IF NOT EXISTS tip_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tip_presets       int[]   NOT NULL DEFAULT '{10,15,20}',
  ADD COLUMN IF NOT EXISTS occasions         text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities         jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dress_code        text,
  ADD COLUMN IF NOT EXISTS languages_spoken  text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS walk_in_ok        boolean NOT NULL DEFAULT true,
  -- KDS: a 6-digit PIN to access kitchen display without staff login
  ADD COLUMN IF NOT EXISTS kds_pin           text;

-- ── 4. ORDERS: waiter mode + cancel window ───────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS placed_by    text NOT NULL DEFAULT 'customer'
                           CHECK (placed_by IN ('customer', 'staff')),
  ADD COLUMN IF NOT EXISTS waiter_name  text;

-- ── 5. INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_combo_deals_business ON combo_deals (business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items (is_available);

-- ── 6. ORDERS: tip amount ─────────────────────────────────────────────────────
-- Added here as part of Phase 1 enrichment; activate in orders/route.ts
-- after running this migration.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tip_amount numeric(10,2);

