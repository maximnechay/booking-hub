// app/api/widget/[slug]/cancel-hold/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { rateLimiters, checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/security/rate-limit'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const cancelSchema = z.object({
    hold_id: z.string().uuid(),
    session_token: z.string().min(1),
})

// POST /api/widget/[slug]/cancel-hold
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        // Rate limiting
        const rateLimitKey = getRateLimitKey(request, slug)
        const rateLimit = await checkRateLimit(rateLimiters.widgetReserve, rateLimitKey)

        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }

        const body = await request.json()

        const validationResult = cancelSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
            }, { status: 400 })
        }

        const { hold_id, session_token } = validationResult.data

        // Получаем tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        // Удаляем hold (только если session_token совпадает)
        const { error } = await supabaseAdmin
            .from('slot_holds')
            .delete()
            .eq('id', hold_id)
            .eq('session_token', session_token)
            .eq('tenant_id', tenant.id)

        if (error) {
            console.error('Cancel hold error:', error)
            return NextResponse.json({ error: 'Failed to cancel hold' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Cancel hold error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
