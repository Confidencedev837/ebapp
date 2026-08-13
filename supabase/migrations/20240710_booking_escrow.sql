-- ============================================================
-- SQL MIGRATION: Booking Escrow System & Auto-Release Trigger
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Trigger to manage completion times, cancellations, and escrow logic.
--    When status changes to 'completed':
--      - Set completed_at to NOW()
--      - Set escrow_release_at to NOW() + 24 hours (start the dispute window)
--    When status changes to 'cancelled' or 'no_show':
--      - Set cancelled_at to NOW()
--      - Set escrow_status to 'refunded'
--      - Set payment_status to 'refunded'
--    When status changes to 'confirmed':
--      - Set accepted_at to NOW()
--    When status changes to 'in_progress':
--      - Set started_at to NOW()
CREATE OR REPLACE FUNCTION handle_booking_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle status transition dates
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        NEW.accepted_at = NOW();
    ELSIF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
        NEW.started_at = NOW();
    ELSIF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
        NEW.escrow_release_at = NOW() + INTERVAL '24 hours';
    ELSIF NEW.status IN ('cancelled', 'no_show') AND (OLD.status IS NULL OR OLD.status NOT IN ('cancelled', 'no_show')) THEN
        NEW.cancelled_at = NOW();
        NEW.escrow_status = 'refunded';
        NEW.payment_status = 'refunded';
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_status_update ON bookings;
CREATE TRIGGER on_booking_status_update
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_changes();

-- 2. Cron Job or background task helper to process finalized releases:
--    You can run this periodically (e.g. via pg_cron or hourly Edge Function)
--    UPDATE bookings
--    SET escrow_status = 'released',
--        escrow_released_at = NOW()
--    WHERE status = 'completed'
--      AND escrow_status = 'held'
--      AND escrow_release_at <= NOW();

-- 3. Enable RLS Policies on Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer sees own bookings" ON bookings;
CREATE POLICY "Customer sees own bookings"
ON bookings FOR SELECT
USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Agent sees bookings for their services" ON bookings;
CREATE POLICY "Agent sees bookings for their services"
ON bookings FOR SELECT
USING (
    service_id IN (
        SELECT id FROM services WHERE agent_id = auth.uid()
    ) OR agent_id = auth.uid()
);

DROP POLICY IF EXISTS "Customer can create booking" ON bookings;
CREATE POLICY "Customer can create booking"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customer can update own booking" ON bookings;
CREATE POLICY "Customer can update own booking"
ON bookings FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
    status IN ('cancelled', 'no_show')
);

DROP POLICY IF EXISTS "Agent can update booking status" ON bookings;
CREATE POLICY "Agent can update booking status"
ON bookings FOR UPDATE
USING (
    service_id IN (
        SELECT id FROM services WHERE agent_id = auth.uid()
    ) OR agent_id = auth.uid()
)
WITH CHECK (
    status IN ('confirmed', 'in_progress', 'completed', 'cancelled')
);

-- 4. Follows Table RLS Policies (if not already enabled)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see follows" ON follows;
CREATE POLICY "Anyone can see follows"
ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "User can follow/unfollow" ON follows;
CREATE POLICY "User can follow/unfollow"
ON follows FOR ALL USING (auth.uid() = follower_id);
