// app/api/staff/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStaffSchema } from '@/lib/validations/staff'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/staff/[id]
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

        const { data: staff, error } = await supabase
            .from('staff')
            .select(`
        *,
        services:staff_services(
          service:services(id, name)
        )
      `)
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (error || !staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        return NextResponse.json({ staff })
    } catch (error) {
        console.error('Staff GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/staff/[id]
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

        // Проверяем что мастер принадлежит tenant
        const { data: existingStaff } = await supabase
            .from('staff')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existingStaff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        const body = await request.json()
        const validationResult = updateStaffSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { service_ids, ...staffData } = validationResult.data

        // Обновляем мастера
        const { data: staff, error } = await supabase
            .from('staff')
            .update(staffData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Staff update error:', error)
            return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
        }

        // Обновляем услуги если переданы
        if (service_ids !== undefined) {
            // Удаляем старые связи
            await supabase
                .from('staff_services')
                .delete()
                .eq('staff_id', id)

            // Добавляем новые
            if (service_ids.length > 0) {
                const staffServices = service_ids.map(service_id => ({
                    staff_id: id,
                    service_id,
                }))

                await supabase
                    .from('staff_services')
                    .insert(staffServices)
            }
        }

        return NextResponse.json({ staff })
    } catch (error) {
        console.error('Staff PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/staff/[id]
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

        // Проверяем что мастер принадлежит tenant
        const { data: existingStaff } = await supabase
            .from('staff')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existingStaff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        // Проверяем нет ли активных бронирований
        const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', id)
            .in('status', ['pending', 'confirmed'])

        if (bookingsCount && bookingsCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete staff with active bookings'
            }, { status: 400 })
        }

        const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Staff delete error:', error)
            return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Staff DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}