-- Add OG image field to tenants for social sharing
ALTER TABLE tenants
ADD COLUMN og_image_url TEXT;

COMMENT ON COLUMN tenants.og_image_url IS 'Custom OG image URL for social sharing';
