-- 004: Usage tracking table + auto-increment trigger

CREATE TABLE usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Период
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Счётчики
    bookings_count INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, period_start)
);

-- Функция для инкремента счётчика букингов
CREATE OR REPLACE FUNCTION increment_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_stats (tenant_id, period_start, period_end, bookings_count)
    VALUES (
        NEW.tenant_id,
        DATE_TRUNC('month', NOW()),
        DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
        1
    )
    ON CONFLICT (tenant_id, period_start)
    DO UPDATE SET
        bookings_count = usage_stats.bookings_count + 1,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер: инкремент при создании booking
CREATE TRIGGER trigger_increment_booking_count
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status IN ('confirmed', 'pending'))
EXECUTE FUNCTION increment_booking_count();
