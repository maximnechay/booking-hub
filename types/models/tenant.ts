// types/models/tenant.ts

import type { Json } from '../enums'

export interface Tenant {
    id: string
    name: string
    slug: string
    email: string
    phone: string | null
    address: string | null
    timezone: string
    logo_url: string | null
    description: string | null
    cover_image_url: string | null
    website: string | null
    settings: Json
    is_active: boolean
    created_at: string
    updated_at: string
}