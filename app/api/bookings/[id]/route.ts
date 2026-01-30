// app/api/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/bookings/[id]
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
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Получаем букинг с связанными данными
        const { data: booking, error } = await supabase
            .from('bookings')
            .select(`
                *,
                service:services(id, name, duration, price),
                staff:staff(id, name, phone, email),
                variant:service_variants(id, name, duration, price)
            `)
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (error || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Для staff — проверяем что это их букинг
        if (userData.role === 'staff') {
            const { data: staffData } = await supabase
                .from('staff')
                .select('id')
                .eq('user_id', user.id)
                .eq('tenant_id', userData.tenant_id)
                .single()

            if (!staffData || booking.staff_id !== staffData.id) {
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
            }
        }

        return NextResponse.json({ booking })
    } catch (error) {
        console.error('Booking GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/bookings/[id] (отмена)
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

        // Staff не может удалять букинги
        if (userData.role === 'staff') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Проверяем что букинг существует
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Soft delete — отменяем букинг
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)

        if (updateError) {
            console.error('Booking delete error:', updateError)
            return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Buchung storniert' })
    } catch (error) {
        console.error('Booking DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}