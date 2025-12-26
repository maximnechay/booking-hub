// app/api/services/[id]/variants/[variantId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateVariantSchema } from '@/lib/validations/variants'

interface RouteParams {
    params: Promise<{ id: string; variantId: string }>
}

// PUT /api/services/[id]/variants/[variantId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, variantId } = await params
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

        // Проверяем что вариант принадлежит услуге
        const { data: existingVariant } = await supabase
            .from('service_variants')
            .select('id')
            .eq('id', variantId)
            .eq('service_id', id)
            .single()

        if (!existingVariant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }

        const body = await request.json()
        const validationResult = updateVariantSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { data: variant, error } = await supabase
            .from('service_variants')
            .update(validationResult.data)
            .eq('id', variantId)
            .select()
            .single()

        if (error) {
            console.error('Variant update error:', error)
            return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
        }

        return NextResponse.json({ variant })
    } catch (error) {
        console.error('Variant PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/services/[id]/variants/[variantId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, variantId } = await params
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

        const { error } = await supabase
            .from('service_variants')
            .delete()
            .eq('id', variantId)
            .eq('service_id', id)

        if (error) {
            console.error('Variant delete error:', error)
            return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Variant DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}