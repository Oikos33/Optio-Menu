-- =====================================================
-- Migration 003: Orders & Order Items
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses ON DELETE CASCADE,
  table_id     uuid        REFERENCES tables ON DELETE SET NULL,
  table_name   text,       -- snapshot at order time (table may be renamed later)
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','confirmed','preparing','ready','delivered','paid','cancelled')),
  notes        text,
  total        numeric(10,2),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid        NOT NULL REFERENCES orders ON DELETE CASCADE,
  menu_item_id uuid        REFERENCES menu_items ON DELETE SET NULL,
  name         text        NOT NULL, -- snapshot at order time
  price        numeric(10,2),
  quantity     int         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes        text,       -- per-item customer note (e.g. "no onions")
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','preparing','ready','served')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Trigger to keep orders.updated_at fresh
CREATE OR REPLACE FUNCTION set_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_orders_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_business_id   ON orders (business_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id      ON orders (table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can read + update their business's orders
CREATE POLICY "owners_read_orders"
  ON orders FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "owners_update_orders"
  ON orders FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Anyone (inc. anon) can INSERT an order (place an order)
CREATE POLICY "public_insert_orders"
  ON orders FOR INSERT TO public
  WITH CHECK (true);

-- Anyone can read a specific order by ID (needed for order tracking)
CREATE POLICY "public_read_order_by_id"
  ON orders FOR SELECT TO public
  USING (true);

-- Order items follow same pattern
CREATE POLICY "owners_read_order_items"
  ON order_items FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "owners_update_order_items"
  ON order_items FOR UPDATE TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "public_insert_order_items"
  ON order_items FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "public_read_order_items_by_order"
  ON order_items FOR SELECT TO public
  USING (true);

-- Enable realtime for live order updates in the kitchen dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
