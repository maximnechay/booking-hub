// lib/services/plan-service.ts

import { supabaseAdmin } from '@/lib/supabase/admin'
import type { PlanId, Plan, UsageStats, LimitCheckResult } from '@/types/plans'

export class PlanService {

    /**
     * Получить план tenant'а с features
     */
    static async getTenantPlan(tenantId: string): Promise<Plan | null> {
        const { data } = await supabaseAdmin
            .from('tenants')
            .select(`
                plan_id,
                plan:plans(*)
            `)
            .eq('id', tenantId)
            .single()

        return (data?.plan as unknown as Plan) || null
    }

    /**
     * Проверить feature flag
     */
    static async hasFeature(tenantId: string, feature: keyof Plan): Promise<boolean> {
        const plan = await this.getTenantPlan(tenantId)
        if (!plan) return false
        return Boolean(plan[feature])
    }

    /**
     * Получить текущее использование
     */
    static async getUsageStats(tenantId: string): Promise<UsageStats> {
        const plan = await this.getTenantPlan(tenantId)

        // Количество staff
        const { count: staffCount } = await supabaseAdmin
            .from('staff')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('is_active', true)

        // Количество bookings в этом месяце
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: bookingsCount } = await supabaseAdmin
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfMonth.toISOString())
            .in('status', ['confirmed', 'completed', 'pending'])

        const bookingsLimit = plan?.max_bookings_per_month || null
        const staffLimit = plan?.max_staff || null

        return {
            bookings_count: bookingsCount || 0,
            bookings_limit: bookingsLimit,
            bookings_percentage: bookingsLimit
                ? Math.round(((bookingsCount || 0) / bookingsLimit) * 100)
                : 0,
            staff_count: staffCount || 0,
            staff_limit: staffLimit,
            staff_percentage: staffLimit
                ? Math.round(((staffCount || 0) / staffLimit) * 100)
                : 0,
        }
    }

    /**
     * Проверить лимит на bookings
     */
    static async checkBookingLimit(tenantId: string): Promise<LimitCheckResult> {
        const usage = await this.getUsageStats(tenantId)

        if (usage.bookings_limit === null) {
            return { allowed: true, current: usage.bookings_count, limit: null }
        }

        const allowed = usage.bookings_count < usage.bookings_limit

        return {
            allowed,
            current: usage.bookings_count,
            limit: usage.bookings_limit,
            message: allowed
                ? undefined
                : `Monatliches Terminlimit erreicht (${usage.bookings_limit}). Bitte upgraden Sie Ihren Plan.`
        }
    }

    /**
     * Проверить лимит на staff
     */
    static async checkStaffLimit(tenantId: string): Promise<LimitCheckResult> {
        const usage = await this.getUsageStats(tenantId)

        if (usage.staff_limit === null) {
            return { allowed: true, current: usage.staff_count, limit: null }
        }

        const allowed = usage.staff_count < usage.staff_limit

        return {
            allowed,
            current: usage.staff_count,
            limit: usage.staff_limit,
            message: allowed
                ? undefined
                : `Mitarbeiterlimit erreicht (${usage.staff_limit}). Bitte upgraden Sie Ihren Plan.`
        }
    }

    /**
     * Сменить план
     */
    static async changePlan(tenantId: string, newPlanId: PlanId): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('tenants')
            .update({
                plan_id: newPlanId,
                updated_at: new Date().toISOString()
            })
            .eq('id', tenantId)

        return !error
    }
}
