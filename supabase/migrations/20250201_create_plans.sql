-- 001: Plans table - справочник тарифных планов

CREATE TABLE plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL, -- в центах (900 = 9€)
    price_yearly INTEGER, -- годовая цена (опционально)

    -- Лимиты
    max_staff INTEGER, -- NULL = unlimited
    max_bookings_per_month INTEGER, -- NULL = unlimited
    max_locations INTEGER DEFAULT 1, -- NULL = unlimited

    -- Features (boolean flags)
    feature_email_staff BOOLEAN DEFAULT false,
    feature_reminder_24h BOOLEAN DEFAULT false,
    feature_review_email BOOLEAN DEFAULT false,
    feature_priority_support BOOLEAN DEFAULT false,
    feature_api_access BOOLEAN DEFAULT false,
    feature_custom_branding BOOLEAN DEFAULT false,

    -- Meta
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans
INSERT INTO plans (id, name, price_monthly, sort_order, max_staff, max_bookings_per_month, max_locations,
    feature_email_staff, feature_reminder_24h, feature_review_email, feature_priority_support)
VALUES
    ('starter', 'Starter', 900, 0, 3, 100, 1, false, false, false, false),
    ('pro', 'Pro', 1900, 1, 10, 300, 1, true, true, true, false),
    ('business', 'Business', 3900, 2, NULL, NULL, NULL, true, true, true, true);
