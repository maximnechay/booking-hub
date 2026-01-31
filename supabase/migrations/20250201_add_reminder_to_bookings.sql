-- 003: Add reminder and review email tracking to bookings

ALTER TABLE bookings
ADD COLUMN reminder_sent_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN review_email_sent_at TIMESTAMPTZ;

-- Индекс для cron: найти bookings для напоминания
CREATE INDEX idx_bookings_reminder
ON bookings (start_time, status, reminder_sent_at)
WHERE status = 'confirmed' AND reminder_sent_at IS NULL;

-- Индекс для cron: найти bookings для review email
CREATE INDEX idx_bookings_review
ON bookings (end_time, status, review_email_sent_at)
WHERE status = 'completed' AND review_email_sent_at IS NULL;
