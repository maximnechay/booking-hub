-- Add cancel_token to bookings table for client self-cancellation

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancel_token TEXT UNIQUE;

-- Index for fast lookup by token
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token
ON bookings(cancel_token)
WHERE cancel_token IS NOT NULL;
