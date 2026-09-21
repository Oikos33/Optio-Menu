-- =====================================================
-- Migration 006: Reservation System
-- Run this in Supabase SQL Editor
-- =====================================================

-- ── Reservation settings (one row per business) ──────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_settings (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id               uuid        UNIQUE NOT NULL REFERENCES businesses ON DELETE CASCADE,

  -- Slot configuration
  slot_duration_minutes     int         NOT NULL DEFAULT 90,   -- how long each booking holds the table
  slot_interval_minutes     int         NOT NULL DEFAULT 30,   -- frequency of start times
  max_party_size            int         NOT NULL DEFAULT 12,
  max_covers_per_slot       int         NOT NULL DEFAULT 30,   -- total guests that can start at the same time
  max_advance_days          int         NOT NULL DEFAULT 60,   -- how far ahead a customer can book
  min_advance_hours         int         NOT NULL DEFAULT 1,    -- minimum notice required

  -- Operating hours (0 = Sunday … 6 = Saturday)
  -- Each day: null means closed, otherwise { open: "HH:MM", close: "HH:MM" }
  hours                     jsonb       NOT NULL DEFAULT '{
    "0": null,
    "1": {"open": "11:30", "close": "22:00"},
    "2": {"open": "11:30", "close": "22:00"},
    "3": {"open": "11:30", "close": "22:00"},
    "4": {"open": "11:30", "close": "22:00"},
    "5": {"open": "11:30", "close": "22:30"},
    "6": {"open": "11:00", "close": "22:30"}
  }',

  -- Deposit (Phase 4 — Stripe)
  deposit_required          boolean     NOT NULL DEFAULT false,
  deposit_amount            numeric(10,2),

  -- Messaging
  confirmation_message      text,       -- custom thank-you shown after booking
  cancellation_policy       text,

  reservations_enabled      boolean     NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- ── Blackout dates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_blackouts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid        NOT NULL REFERENCES businesses ON DELETE CASCADE,
  date         date        NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, date)
);

-- ── Reservations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid        NOT NULL REFERENCES businesses ON DELETE CASCADE,
  table_id            uuid        REFERENCES tables ON DELETE SET NULL,

  -- Customer
  customer_name       text        NOT NULL,
  customer_phone      text,
  customer_email      text,
  party_size          int         NOT NULL CHECK (party_size >= 1),

  -- Timing
  reservation_date    date        NOT NULL,
  reservation_time    time        NOT NULL,
  duration_minutes    int         NOT NULL DEFAULT 90,

  -- Status
  status              text        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),

  -- Extras
  special_requests    text,
  occasion            text,       -- birthday | anniversary | business | date | family | proposal | other
  internal_notes      text,       -- staff-only notes

  -- Unique code shown to customer
  confirmation_code   text        UNIQUE NOT NULL
                      DEFAULT upper(left(replace(gen_random_uuid()::text, '-', ''), 8)),

  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_business_date
  ON reservations (business_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON reservations (business_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_code
  ON reservations (confirmation_code);

-- RLS
ALTER TABLE reservations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_blackouts ENABLE ROW LEVEL SECURITY;

-- Reservations: anyone can insert (public booking) + read own by confirmation code
CREATE POLICY "public_can_book"
  ON reservations FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "public_can_read_own"
  ON reservations FOR SELECT TO public
  USING (true);  -- filtered by confirmation_code in app logic

CREATE POLICY "owners_can_manage_reservations"
  ON reservations FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Settings: owner manages
CREATE POLICY "owners_manage_settings"
  ON reservation_settings FOR ALL TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "public_read_settings"
  ON reservation_settings FOR SELECT TO public USING (true);

-- Blackouts: owner manages, public reads
CREATE POLICY "owners_manage_blackouts"
  ON reservation_blackouts FOR ALL TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "public_read_blackouts"
  ON reservation_blackouts FOR SELECT TO public USING (true);

-- Realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
