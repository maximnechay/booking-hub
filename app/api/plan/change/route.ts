// app/api/plan/change/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlanService } from '@/lib/services/plan-service'
import { z } from 'zod'

const changePlanSchema = z.object({
    plan_id: z.enum(['starter', 'pro', 'business']),
})

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Только owner может менять план
        if (userData.role !== 'owner') {
            return NextResponse.json({ error: 'Only owner can change plan' }, { status: 403 })
        }

        const body = await request.json()
        const validation = changePlanSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 })
        }

        const { plan_id } = validation.data

        // TODO: В будущем здесь будет Stripe checkout
        const success = await PlanService.changePlan(userData.tenant_id, plan_id)

        if (!success) {
            return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Plan wurde zu "${plan_id}" geändert.`
        })
    } catch (error) {
        console.error('Plan change error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
