-- =====================================================
-- Migration 005: Dish Intelligence
-- Run this in Supabase SQL Editor
-- =====================================================

ALTER TABLE menu_items
  -- Restaurant-provided intelligence (multilingual JSON like name/description)
  ADD COLUMN IF NOT EXISTS dish_story       jsonb,   -- { en: "...", ja: "..." }
  ADD COLUMN IF NOT EXISTS how_to_eat       jsonb,   -- { en: ["step1","step2"], ja: [...] }
  ADD COLUMN IF NOT EXISTS insider_tips     jsonb,   -- { en: ["tip1","tip2"], ja: [...] }
  ADD COLUMN IF NOT EXISTS video_url        text,    -- YouTube URL for how-to-eat
  -- Dietary + occasion tags
  ADD COLUMN IF NOT EXISTS dish_tags        text[]  NOT NULL DEFAULT '{}',
  -- Seasonal availability
  ADD COLUMN IF NOT EXISTS available_seasons text[] NOT NULL DEFAULT '{}';

-- Index for filtering by tags (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_menu_items_tags ON menu_items USING GIN (dish_tags);

-- Cache for Wikipedia / external dish intelligence
CREATE TABLE IF NOT EXISTS dish_intel_cache (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name_normalized text        NOT NULL,
  language             text        NOT NULL DEFAULT 'en',
  extract              text,
  source_url           text,
  image_url            text,
  source               text        NOT NULL DEFAULT 'wikipedia',
  fetched_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dish_name_normalized, language)
);

-- ── Dish reviews table (MVP for ranking engine in Phase 2C) ──────────────────
CREATE TABLE IF NOT EXISTS dish_reviews (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users ON DELETE SET NULL,
  menu_item_id   uuid        REFERENCES menu_items ON DELETE CASCADE,
  business_id    uuid        NOT NULL REFERENCES businesses ON DELETE CASCADE,
  rating         numeric(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text    text,
  photo_path     text,
  tags           text[]      NOT NULL DEFAULT '{}',  -- Authentic, Value, Unique, Presentation
  is_verified    boolean     NOT NULL DEFAULT false,  -- true if placed via Optio
  order_id       uuid        REFERENCES orders ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dish_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_insert_review"
  ON dish_reviews FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "anyone_can_read_reviews"
  ON dish_reviews FOR SELECT TO public USING (true);

CREATE POLICY "users_can_delete_own_reviews"
  ON dish_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dish_reviews_item     ON dish_reviews (menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dish_reviews_business ON dish_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_dish_reviews_rating   ON dish_reviews (rating);

ALTER PUBLICATION supabase_realtime ADD TABLE dish_reviews;
