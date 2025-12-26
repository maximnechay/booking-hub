// types/models/booking.ts

import type { BookingStatus } from '../enums'

export interface Booking {
    id: string
    tenant_id: string
    service_id: string
    staff_id: string
    client_name: string
    client_phone: string
    client_email: string | null
    start_time: string
    end_time: string
    status: BookingStatus
    confirmation_code_hash: string
    notes: string | null
    price_at_booking: number
    duration_at_booking: number
    source: string
    expires_at: string | null
    cancelled_at: string | null
    cancelled_by: string | null
    created_at: string
    updated_at: string
}