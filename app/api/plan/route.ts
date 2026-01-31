// app/api/plan/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlanService } from '@/lib/services/plan-service'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const [plan, usage] = await Promise.all([
            PlanService.getTenantPlan(userData.tenant_id),
            PlanService.getUsageStats(userData.tenant_id),
        ])

        // Все доступные планы для сравнения
        const { data: allPlans } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order')

        return NextResponse.json({
            current_plan: plan,
            usage,
            available_plans: allPlans,
        })
    } catch (error) {
        console.error('Plan GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
