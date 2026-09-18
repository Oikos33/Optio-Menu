-- ============================================================
-- Optio Menu — Schema Migration 001
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Business types (Restaurant, Café, Bar, etc.)
CREATE TABLE IF NOT EXISTS business_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Businesses owned by users
CREATE TABLE IF NOT EXISTS businesses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  business_type_id  uuid REFERENCES business_types ON DELETE SET NULL,
  name              text NOT NULL,
  slug              text NOT NULL UNIQUE,
  description       text,
  address           text,
  latitude          decimal(10,7),
  longitude         decimal(10,7),
  logo_path         text,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Optional menu sections (Starters, Mains, Drinks, etc.)
CREATE TABLE IF NOT EXISTS menu_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses ON DELETE CASCADE,
  name        jsonb NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Menu items (dishes)
CREATE TABLE IF NOT EXISTS menu_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES businesses ON DELETE CASCADE,
  menu_section_id  uuid REFERENCES menu_sections ON DELETE SET NULL,
  name             jsonb NOT NULL,
  description      jsonb,
  price            decimal(8,2),
  image_path       text,
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Comments on dishes
CREATE TABLE IF NOT EXISTS menu_item_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id  uuid NOT NULL REFERENCES menu_items ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  body          text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 1000),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Favourites (user ↔ menu item pivot)
CREATE TABLE IF NOT EXISTS user_favorite_menu_items (
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  menu_item_id  uuid NOT NULL REFERENCES menu_items ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, menu_item_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_businesses_user_id        ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug           ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active      ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_sections_business    ON menu_sections(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_business       ON menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_section        ON menu_items(menu_section_id);
CREATE INDEX IF NOT EXISTS idx_comments_menu_item        ON menu_item_comments(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user            ON user_favorite_menu_items(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HELPER: get businesses owned by current user
-- ============================================================

CREATE OR REPLACE FUNCTION owned_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE user_id = auth.uid();
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- business_types (read-only public) ----
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_types: anyone can read"
  ON business_types FOR SELECT
  USING (true);

-- ---- businesses ----
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses: public can read active"
  ON businesses FOR SELECT
  USING (is_active = true);

CREATE POLICY "businesses: owner can read own (inc inactive)"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "businesses: owner can insert"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses: owner can update"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses: owner can delete"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- menu_sections ----
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_sections: public read via active business"
  ON menu_sections FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE is_active = true
    )
  );

CREATE POLICY "menu_sections: owner can insert"
  ON menu_sections FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT owned_business_ids()));

CREATE POLICY "menu_sections: owner can update"
  ON menu_sections FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT owned_business_ids()));

CREATE POLICY "menu_sections: owner can delete"
  ON menu_sections FOR DELETE
  TO authenticated
  USING (business_id IN (SELECT owned_business_ids()));

-- ---- menu_items ----
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items: public read via active business"
  ON menu_items FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE is_active = true
    )
  );

CREATE POLICY "menu_items: owner can read all own items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT owned_business_ids()));

CREATE POLICY "menu_items: owner can insert"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT owned_business_ids()));

CREATE POLICY "menu_items: owner can update"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT owned_business_ids()));

CREATE POLICY "menu_items: owner can delete"
  ON menu_items FOR DELETE
  TO authenticated
  USING (business_id IN (SELECT owned_business_ids()));

-- ---- menu_item_comments ----
ALTER TABLE menu_item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments: anyone can read"
  ON menu_item_comments FOR SELECT
  USING (true);

CREATE POLICY "comments: authenticated can insert"
  ON menu_item_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments: author can delete own"
  ON menu_item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- user_favorite_menu_items ----
ALTER TABLE user_favorite_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites: own rows only"
  ON user_favorite_menu_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME (enable for comments)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE menu_item_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_favorite_menu_items;
