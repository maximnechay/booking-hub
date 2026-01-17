// app/api/cancel/[token]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ token: string }>
}

// GET - получить информацию о бронировании по токену
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params

        if (!token || token.length < 20) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                end_time,
                client_name,
                service:services(name),
                staff:staff(name),
                tenant:tenants(name)
            `)
            .eq('cancel_token', token)
            .single()

        if (error || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Проверяем, можно ли отменить
        const canCancel = booking.status === 'confirmed' || booking.status === 'pending'
        const isPast = new Date(booking.start_time) < new Date()

        return NextResponse.json({
            booking: {
                id: booking.id,
                status: booking.status,
                start_time: booking.start_time,
                end_time: booking.end_time,
                client_name: booking.client_name,
                service_name: booking.service?.name,
                staff_name: booking.staff?.name,
                salon_name: booking.tenant?.name,
            },
            canCancel: canCancel && !isPast,
            reason: isPast ? 'past' : (!canCancel ? 'already_cancelled' : null),
        })
    } catch (error) {
        console.error('Cancel GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - отменить бронирование
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params

        if (!token || token.length < 20) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        // Получаем бронирование
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, status, start_time')
            .eq('cancel_token', token)
            .single()

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Проверяем статус
        if (booking.status !== 'confirmed' && booking.status !== 'pending') {
            return NextResponse.json({
                error: 'ALREADY_CANCELLED',
                message: 'Diese Buchung wurde bereits storniert.'
            }, { status: 400 })
        }

        // Проверяем, не прошла ли дата
        if (new Date(booking.start_time) < new Date()) {
            return NextResponse.json({
                error: 'PAST_BOOKING',
                message: 'Vergangene Termine können nicht storniert werden.'
            }, { status: 400 })
        }

        // Отменяем бронирование
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: 'client',
            })
            .eq('id', booking.id)

        if (updateError) {
            console.error('Cancel update error:', updateError)
            return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Buchung erfolgreich storniert.'
        })
    } catch (error) {
        console.error('Cancel POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
