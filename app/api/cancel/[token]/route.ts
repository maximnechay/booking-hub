// app/api/cancel/[token]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendBookingCancellation } from '@/lib/email/send-booking-cancellation'
import { sendAdminCancellationNotification } from '@/lib/email/send-admin-cancellation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

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

        // Получаем полные данные бронирования для email
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                client_name,
                client_phone,
                client_email,
                service:services(name),
                staff:staff(name),
                tenant:tenants(id, name, slug, email)
            `)
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

        // Форматируем данные для email
        const startTime = new Date(booking.start_time)
        const dateFormatted = format(startTime, "EEEE, d. MMMM yyyy", { locale: de })
        const timeFormatted = format(startTime, "HH:mm")

        const tenant = booking.tenant as { id: string; name: string; slug: string; email: string }
        const service = booking.service as { name: string } | null
        const staff = booking.staff as { name: string } | null

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking-hub.vercel.app'
        const bookingUrl = `${baseUrl}/book/${tenant.slug}`

        // Отправляем email клиенту (async)
        if (booking.client_email) {
            sendBookingCancellation({
                to: booking.client_email,
                clientName: booking.client_name,
                salonName: tenant.name,
                serviceName: service?.name || 'Service',
                staffName: staff?.name || 'Mitarbeiter',
                date: dateFormatted,
                time: timeFormatted,
                bookingUrl,
            }).then(result => {
                if (result.success) {
                    console.log(`📧 Cancellation email sent to client for booking ${booking.id}`)
                } else {
                    console.error(`📧 Failed to send cancellation email to client:`, result.error)
                }
            })
        }

        // Отправляем email салону (async)
        sendAdminCancellationNotification({
            to: tenant.email,
            salonName: tenant.name,
            clientName: booking.client_name,
            clientPhone: booking.client_phone,
            clientEmail: booking.client_email,
            serviceName: service?.name || 'Service',
            staffName: staff?.name || 'Mitarbeiter',
            date: dateFormatted,
            time: timeFormatted,
        }).then(result => {
            if (result.success) {
                console.log(`📧 Cancellation notification sent to salon for booking ${booking.id}`)
            } else {
                console.error(`📧 Failed to send cancellation notification to salon:`, result.error)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Buchung erfolgreich storniert.'
        })
    } catch (error) {
        console.error('Cancel POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
