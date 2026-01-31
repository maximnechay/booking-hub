// types/plans.ts

export type PlanId = 'starter' | 'pro' | 'business'

export interface Plan {
    id: PlanId
    name: string
    price_monthly: number // в центах
    price_yearly: number | null

    // Лимиты
    max_staff: number | null // null = unlimited
    max_bookings_per_month: number | null
    max_locations: number | null

    // Features
    feature_email_staff: boolean
    feature_reminder_24h: boolean
    feature_review_email: boolean
    feature_priority_support: boolean
    feature_api_access: boolean
    feature_custom_branding: boolean
}

export interface TenantWithPlan {
    id: string
    name: string
    plan_id: PlanId
    plan: Plan
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing'
    trial_ends_at: string | null
    billing_period_start: string
}

export interface UsageStats {
    bookings_count: number
    bookings_limit: number | null
    bookings_percentage: number // 0-100
    staff_count: number
    staff_limit: number | null
    staff_percentage: number
}

export interface LimitCheckResult {
    allowed: boolean
    current: number
    limit: number | null
    message?: string
}
