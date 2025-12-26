// types/models/staff.ts

export interface Staff {
    id: string
    tenant_id: string
    user_id: string | null
    name: string
    email: string | null
    phone: string | null
    avatar_url: string | null
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface StaffService {
    staff_id: string
    service_id: string
}