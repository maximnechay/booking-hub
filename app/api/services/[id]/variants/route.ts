// app/api/services/[id]/variants/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVariantSchema } from '@/lib/validations/variants'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/services/[id]/variants
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        // Проверяем что услуга принадлежит tenant
        const { data: service } = await supabase
            .from('services')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        const { data: variants, error } = await supabase
            .from('service_variants')
            .select('*')
            .eq('service_id', id)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Variants fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
        }

        return NextResponse.json({ variants })
    } catch (error) {
        console.error('Variants GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/services/[id]/variants
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        // Проверяем что услуга принадлежит tenant
        const { data: service } = await supabase
            .from('services')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        const body = await request.json()
        const validationResult = createVariantSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { data: variant, error } = await supabase
            .from('service_variants')
            .insert({
                service_id: id,
                ...validationResult.data,
            })
            .select()
            .single()

        if (error) {
            console.error('Variant creation error:', error)
            return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
        }

        return NextResponse.json({ variant }, { status: 201 })
    } catch (error) {
        console.error('Variants POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}