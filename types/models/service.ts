// types/models/service.ts

export interface Service {
    id: string
    tenant_id: string
    name: string
    description: string | null
    duration: number
    price: number
    buffer_after: number
    min_advance_hours: number
    max_advance_days: number
    is_active: boolean
    online_booking_enabled: boolean
    sort_order: number
    created_at: string
    updated_at: string
}