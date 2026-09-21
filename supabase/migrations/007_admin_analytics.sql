-- =====================================================
-- Migration 007: Platform Admin + Analytics Views
-- Run this in Supabase SQL Editor
-- =====================================================

-- ── Platform Admins ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  added_by   uuid        REFERENCES auth.users ON DELETE SET NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only existing admins can manage this table
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_read_admins"
  ON platform_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM platform_admins));

CREATE POLICY "admins_can_insert_admins"
  ON platform_admins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT user_id FROM platform_admins));

CREATE POLICY "admins_can_delete_admins"
  ON platform_admins FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM platform_admins) AND user_id != auth.uid());

-- ── Contact messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  email        text        NOT NULL,
  subject      text        NOT NULL,
  message      text        NOT NULL,
  source       text        NOT NULL DEFAULT 'contact_form',  -- 'contact_form' | 'partnership' | 'support'
  status       text        NOT NULL DEFAULT 'unread'
               CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit, only admins can read/manage
CREATE POLICY "public_can_submit"
  ON contact_messages FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admins_can_read_messages"
  ON contact_messages FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM platform_admins));

CREATE POLICY "admins_can_update_messages"
  ON contact_messages FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM platform_admins));

-- ── HOW TO MAKE YOURSELF AN ADMIN ─────────────────────────────────────────────
-- Run the following after creating your account:
--
--   INSERT INTO platform_admins (user_id, note)
--   SELECT id, 'Platform founder'
--   FROM auth.users
--   WHERE email = 'YOUR_EMAIL_HERE'
--   LIMIT 1;
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Analytics helper view: daily revenue ─────────────────────────────────────
CREATE OR REPLACE VIEW business_daily_revenue AS
WITH order_totals AS (
  SELECT
    o.id,
    o.business_id,
    date_trunc('day', o.created_at)::date   AS day,
    COALESCE(o.tip_amount, 0)               AS tip,
    COALESCE(SUM(oi.price * oi.quantity), 0) AS items_total
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status NOT IN ('cancelled')
  GROUP BY o.id, o.business_id, day, o.tip_amount
)
SELECT
  business_id,
  day,
  COUNT(*)               AS order_count,
  SUM(items_total + tip) AS revenue
FROM order_totals
GROUP BY business_id, day;

-- ── Analytics helper view: dish popularity ───────────────────────────────────
CREATE OR REPLACE VIEW dish_popularity AS
SELECT
  o.business_id,
  oi.name                               AS dish_name,
  COUNT(*)                              AS order_count,
  COALESCE(SUM(oi.quantity), 0)         AS total_qty,
  COALESCE(AVG(oi.price), 0)            AS avg_price
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled')
GROUP BY o.business_id, oi.name;

-- Grant read access to authenticated users
GRANT SELECT ON business_daily_revenue TO authenticated;
GRANT SELECT ON dish_popularity TO authenticated;
