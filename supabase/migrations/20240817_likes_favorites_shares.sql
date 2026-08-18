-- ============================================================
-- MIGRATION: Service Likes & Service Shares
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. SERVICE LIKES ────────────────────────────────────────
-- One row per (user_id, service_id) pair.
-- Unique constraint prevents duplicate likes.
CREATE TABLE IF NOT EXISTS service_likes (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at  timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, service_id)
);

-- Index for fast look-ups by service
CREATE INDEX IF NOT EXISTS idx_service_likes_service_id ON service_likes(service_id);
-- Index for fast look-ups by user
CREATE INDEX IF NOT EXISTS idx_service_likes_user_id ON service_likes(user_id);

-- Enable RLS
ALTER TABLE service_likes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read like counts (aggregate reads)
DROP POLICY IF EXISTS "Authenticated users can read service likes" ON service_likes;
CREATE POLICY "Authenticated users can read service likes"
ON service_likes FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own likes
DROP POLICY IF EXISTS "Users can like services" ON service_likes;
CREATE POLICY "Users can like services"
ON service_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
DROP POLICY IF EXISTS "Users can unlike services" ON service_likes;
CREATE POLICY "Users can unlike services"
ON service_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ── 2. SERVICE SHARES ────────────────────────────────────────
-- Records every share event (not unique per user/service —
-- a user can share multiple times over different sessions).
-- share_type is optional metadata (e.g. 'native', 'copy', 'external').
CREATE TABLE IF NOT EXISTS service_shares (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    share_type  text,
    created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for fast look-ups by service
CREATE INDEX IF NOT EXISTS idx_service_shares_service_id ON service_shares(service_id);
-- Index for fast look-ups by user
CREATE INDEX IF NOT EXISTS idx_service_shares_user_id ON service_shares(user_id);

-- Enable RLS
ALTER TABLE service_shares ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read share counts
DROP POLICY IF EXISTS "Authenticated users can read service shares" ON service_shares;
CREATE POLICY "Authenticated users can read service shares"
ON service_shares FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own share records
DROP POLICY IF EXISTS "Users can track their own shares" ON service_shares;
CREATE POLICY "Users can track their own shares"
ON service_shares FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- ── 3. FAVORITES TABLE — Enable RLS (if not already enabled) ─
-- The favorites table tracks bookmarks/saves for the Profile tab.
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
CREATE POLICY "Users can read own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = customer_id);

-- Prevent duplicate favorites (if constraint doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'favorites_customer_id_service_id_key'
          AND conrelid = 'favorites'::regclass
    ) THEN
        ALTER TABLE favorites ADD CONSTRAINT favorites_customer_id_service_id_key
            UNIQUE (customer_id, service_id);
    END IF;
END $$;
