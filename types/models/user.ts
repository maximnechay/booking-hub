// types/models/user.ts

import type { UserRole } from '../enums'

export interface User {
    id: string
    tenant_id: string
    email: string
    name: string
    role: UserRole
    avatar_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}