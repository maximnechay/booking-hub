// app/api/services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateServiceSchema } from '@/lib/validations/services'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/services/[id]
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

        const { data: service, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (error || !service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        return NextResponse.json({ service })
    } catch (error) {
        console.error('Service GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/services/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        const { data: existingService } = await supabase
            .from('services')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existingService) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Валидация через Zod
        const body = await request.json()
        const validationResult = updateServiceSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const validatedData = validationResult.data

        const { data: service, error } = await supabase
            .from('services')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Service update error:', error)
            return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
        }

        return NextResponse.json({ service })
    } catch (error) {
        console.error('Service PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/services/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        const { data: existingService } = await supabase
            .from('services')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existingService) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Проверяем нет ли активных бронирований
        const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', id)
            .in('status', ['pending', 'confirmed'])

        if (bookingsCount && bookingsCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete service with active bookings'
            }, { status: 400 })
        }

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Service delete error:', error)
            return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Service DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}