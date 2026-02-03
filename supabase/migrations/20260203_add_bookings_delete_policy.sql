-- Allow owner/admin to hard-delete bookings within their tenant
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_delete_owner_admin" ON bookings;
CREATE POLICY "bookings_delete_owner_admin"
ON bookings
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = auth.uid()
          AND u.tenant_id = bookings.tenant_id
          AND u.role IN ('owner', 'admin')
    )
);
