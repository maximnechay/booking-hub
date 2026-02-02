-- Добавляем поля для reschedule в bookings

-- Токен для переноса (аналогично cancel_token)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reschedule_token TEXT UNIQUE;

-- Флаг: был ли перенос
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS was_rescheduled BOOLEAN DEFAULT false;

-- Когда был перенос
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;

-- Исходное время (до переноса) — для истории
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS original_start_time TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS original_end_time TIMESTAMPTZ;

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token
ON bookings(reschedule_token)
WHERE reschedule_token IS NOT NULL;

-- Комментарии
COMMENT ON COLUMN bookings.reschedule_token IS
'Уникальный токен для переноса записи клиентом. Одноразовый.';

COMMENT ON COLUMN bookings.was_rescheduled IS
'True если запись была перенесена. Повторный перенос запрещён.';
