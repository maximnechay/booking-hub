-- 002: Add plan fields to tenants

ALTER TABLE tenants
ADD COLUMN plan_id TEXT DEFAULT 'starter' REFERENCES plans(id);

-- Дата начала текущего периода (для подсчёта лимитов)
ALTER TABLE tenants
ADD COLUMN billing_period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW());

-- Stripe fields (для будущего биллинга)
ALTER TABLE tenants
ADD COLUMN stripe_customer_id TEXT;

ALTER TABLE tenants
ADD COLUMN stripe_subscription_id TEXT;

-- Статус подписки
ALTER TABLE tenants
ADD COLUMN subscription_status TEXT DEFAULT 'active'
CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- Trial до (опционально)
ALTER TABLE tenants
ADD COLUMN trial_ends_at TIMESTAMPTZ;

-- Индекс
CREATE INDEX idx_tenants_plan ON tenants(plan_id);
