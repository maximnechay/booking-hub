-- Новые поля для публичной страницы салона

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS title TEXT;
