// app/api/services/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceSchema } from '@/lib/validations/services'

// GET /api/services
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

        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Services fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
        }

        return NextResponse.json({ services })
    } catch (error) {
        console.error('Services GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/services
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

        if (userData.role === 'staff') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Валидация через Zod
        const body = await request.json()
        const validationResult = createServiceSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const validatedData = validationResult.data

        const { data: service, error } = await supabase
            .from('services')
            .insert({
                tenant_id: userData.tenant_id,
                ...validatedData,
            })
            .select()
            .single()

        if (error) {
            console.error('Service creation error:', error)
            return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
        }

        return NextResponse.json({ service }, { status: 201 })
    } catch (error) {
        console.error('Services POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}