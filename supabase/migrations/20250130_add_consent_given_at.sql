-- Добавляем поле для хранения времени согласия (GDPR Art. 7)
ALTER TABLE bookings
ADD COLUMN consent_given_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.consent_given_at IS
'Timestamp когда клиент дал согласие на обработку данных (GDPR Art. 7)';
