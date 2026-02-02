// app/api/reschedule/[token]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimiters, checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/security/rate-limit'
import { sendBookingRescheduled } from '@/lib/email/send-booking-rescheduled'
import { sendAdminRescheduleNotification } from '@/lib/email/send-admin-reschedule'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface RouteParams {
    params: Promise<{ token: string }>
}

// GET - получить информацию о записи по reschedule_token
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params

        if (!token || token.length < 20) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        // Rate limiting
        const ip = getClientIP(request)
        const rateLimit = await checkRateLimit(rateLimiters.rescheduleGet, ip)
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }

        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                end_time,
                client_name,
                was_rescheduled,
                service:services(id, name, duration, buffer_after, min_advance_hours, max_advance_days),
                variant:service_variants(id, name, duration),
                staff:staff(id, name),
                tenant:tenants(name, slug)
            `)
            .eq('reschedule_token', token)
            .single()

        if (error || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const service = booking.service as { id: string; name: string; duration: number; buffer_after: number | null; min_advance_hours: number | null; max_advance_days: number | null } | null
        const variant = booking.variant as { id: string; name: string; duration: number } | null
        const staff = booking.staff as { id: string; name: string } | null
        const tenant = booking.tenant as { name: string; slug: string } | null

        const now = new Date()
        const startTime = new Date(booking.start_time)
        const minAdvanceHours = service?.min_advance_hours ?? 0
        const minBookingTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)

        // Определяем можно ли перенести и причину отказа
        let canReschedule = true
        let reason: string | undefined

        if (booking.was_rescheduled) {
            canReschedule = false
            reason = 'already_rescheduled'
        } else if (booking.status !== 'confirmed') {
            canReschedule = false
            reason = 'wrong_status'
        } else if (startTime < now) {
            canReschedule = false
            reason = 'past'
        } else if (startTime < minBookingTime) {
            canReschedule = false
            reason = 'too_late'
        }

        const duration = variant?.duration || service?.duration || 60

        return NextResponse.json({
            booking: {
                id: booking.id,
                status: booking.status,
                start_time: booking.start_time,
                end_time: booking.end_time,
                client_name: booking.client_name,
                service: service ? {
                    id: service.id,
                    name: service.name,
                    duration,
                    min_advance_hours: minAdvanceHours,
                    max_advance_days: service.max_advance_days ?? 90,
                } : null,
                staff: staff ? { id: staff.id, name: staff.name } : null,
                variant: variant ? { id: variant.id, name: variant.name, duration: variant.duration } : null,
                tenant: tenant ? { name: tenant.name, slug: tenant.slug } : null,
            },
            canReschedule,
            reason,
        })
    } catch (error) {
        console.error('Reschedule GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - выполнить перенос записи
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params

        if (!token || token.length < 20) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        // Rate limiting
        const ip = getClientIP(request)
        const rateLimit = await checkRateLimit(rateLimiters.reschedulePost, ip)
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }

        const body = await request.json()
        const { date, time, turnstile_token } = body

        if (!date || !time) {
            return NextResponse.json({
                error: 'INVALID_DATE',
                message: 'Ungültiges Datum.',
            }, { status: 400 })
        }

        // Verify Turnstile
        if (!turnstile_token) {
            return NextResponse.json({
                error: 'CAPTCHA_FAILED',
                message: 'Verifizierung fehlgeschlagen.',
            }, { status: 400 })
        }

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstile_token,
            }),
        })
        const turnstileData = await turnstileRes.json()

        if (turnstileData.success !== true) {
            return NextResponse.json({
                error: 'CAPTCHA_FAILED',
                message: 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
            }, { status: 400 })
        }

        // Получаем полные данные booking
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                start_time,
                end_time,
                client_name,
                client_phone,
                client_email,
                was_rescheduled,
                staff_id,
                service_id,
                variant_id,
                duration_at_booking,
                cancel_token,
                service:services(name, duration, buffer_after, min_advance_hours, max_advance_days),
                variant:service_variants(name, duration),
                staff:staff(name),
                tenant:tenants(id, name, slug, email, address, phone)
            `)
            .eq('reschedule_token', token)
            .single()

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'BOOKING_NOT_FOUND' }, { status: 404 })
        }

        // Проверки
        if (booking.was_rescheduled) {
            return NextResponse.json({
                error: 'ALREADY_RESCHEDULED',
                message: 'Dieser Termin wurde bereits verschoben.',
            }, { status: 400 })
        }

        if (booking.status !== 'confirmed') {
            return NextResponse.json({
                error: 'WRONG_STATUS',
                message: 'Dieser Termin kann nicht verschoben werden.',
            }, { status: 400 })
        }

        const service = booking.service as { name: string; duration: number; buffer_after: number | null; min_advance_hours: number | null; max_advance_days: number | null } | null
        const variant = booking.variant as { name: string; duration: number } | null
        const staff = booking.staff as { name: string } | null
        const tenant = booking.tenant as { id: string; name: string; slug: string; email: string; address: string | null; phone: string | null } | null

        const now = new Date()
        const oldStartTime = new Date(booking.start_time)
        const minAdvanceHours = service?.min_advance_hours ?? 0
        const minBookingTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)

        if (oldStartTime < now) {
            return NextResponse.json({
                error: 'TOO_LATE',
                message: 'Verschieben ist nicht mehr möglich. Bitte kontaktieren Sie den Salon.',
            }, { status: 400 })
        }

        if (oldStartTime < minBookingTime) {
            return NextResponse.json({
                error: 'TOO_LATE',
                message: 'Verschieben ist nicht mehr möglich. Bitte kontaktieren Sie den Salon.',
            }, { status: 400 })
        }

        // Проверка max_advance_days
        const maxAdvanceDays = service?.max_advance_days ?? 90
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
        const requestedDate = new Date(date)

        if (requestedDate > maxDate) {
            return NextResponse.json({
                error: 'INVALID_DATE',
                message: 'Ungültiges Datum.',
            }, { status: 400 })
        }

        // Вычисляем новое время
        const duration = variant?.duration || service?.duration || booking.duration_at_booking
        const totalDuration = duration + (service?.buffer_after || 0)
        const newStart = new Date(`${date}T${time}:00`)
        const newEnd = new Date(newStart.getTime() + totalDuration * 60 * 1000)

        // Проверяем min_advance_hours для нового времени
        if (newStart < minBookingTime) {
            return NextResponse.json({
                error: 'INVALID_DATE',
                message: 'Dieser Zeitslot ist nicht verfügbar.',
            }, { status: 400 })
        }

        // Проверяем что новый слот свободен (исключаем текущую запись)
        const dayStart = `${date}T00:00:00`
        const dayEnd = `${date}T23:59:59`

        const { data: existingBookings } = await supabaseAdmin
            .from('bookings')
            .select('start_time, end_time')
            .eq('staff_id', booking.staff_id)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .in('status', ['pending', 'confirmed'])
            .neq('id', booking.id) // исключаем текущую запись

        const { data: holds } = await supabaseAdmin
            .from('slot_holds')
            .select('start_time, end_time')
            .eq('staff_id', booking.staff_id)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .gt('expires_at', now.toISOString())

        const occupiedSlots = [
            ...(existingBookings || []),
            ...(holds || []),
        ]

        for (const occupied of occupiedSlots) {
            const occStart = new Date(occupied.start_time)
            const occEnd = new Date(occupied.end_time)

            if (newStart < occEnd && newEnd > occStart) {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist nicht mehr verfügbar.',
                }, { status: 400 })
            }
        }

        // Обновляем запись
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({
                original_start_time: booking.start_time,
                original_end_time: booking.end_time,
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
                was_rescheduled: true,
                rescheduled_at: now.toISOString(),
                reschedule_token: null, // инвалидируем токен
                updated_at: now.toISOString(),
            })
            .eq('id', booking.id)

        if (updateError) {
            console.error('Reschedule update error:', updateError)
            return NextResponse.json({ error: 'Reschedule failed' }, { status: 500 })
        }

        // Форматируем данные для emails
        const serviceName = variant
            ? `${service?.name || 'Service'} - ${variant.name}`
            : service?.name || 'Service'
        const staffName = staff?.name || 'Mitarbeiter'

        const oldDate = format(oldStartTime, "EEEE, d. MMMM yyyy", { locale: de })
        const oldTime = format(oldStartTime, "HH:mm")
        const newDate = format(newStart, "EEEE, d. MMMM yyyy", { locale: de })
        const newTime = format(newStart, "HH:mm")

        const formatDuration = (minutes: number) => {
            if (minutes < 60) return `${minutes} Min.`
            const h = Math.floor(minutes / 60)
            const m = minutes % 60
            return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking-hub.vercel.app'

        // Email клиенту
        if (booking.client_email) {
            const cancelUrl = booking.cancel_token
                ? `${baseUrl}/cancel/${booking.cancel_token}`
                : undefined

            sendBookingRescheduled({
                to: booking.client_email,
                clientName: booking.client_name,
                salonName: tenant?.name || 'Salon',
                serviceName,
                staffName,
                oldDate,
                oldTime,
                newDate,
                newTime,
                duration: formatDuration(duration),
                salonAddress: tenant?.address || undefined,
                salonPhone: tenant?.phone || undefined,
                cancelUrl,
            }).then(result => {
                if (result.success) {
                    console.log(`📧 Reschedule confirmation sent to client for booking ${booking.id}`)
                } else {
                    console.error(`📧 Failed to send reschedule confirmation:`, result.error)
                }
            })
        }

        // Email админу
        if (tenant?.email) {
            sendAdminRescheduleNotification({
                to: tenant.email,
                salonName: tenant.name,
                clientName: booking.client_name,
                clientPhone: booking.client_phone,
                clientEmail: booking.client_email,
                serviceName,
                staffName,
                oldDate,
                oldTime,
                newDate,
                newTime,
            }).then(result => {
                if (result.success) {
                    console.log(`📧 Reschedule notification sent to salon for booking ${booking.id}`)
                } else {
                    console.error(`📧 Failed to send reschedule notification to salon:`, result.error)
                }
            })
        }

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
            },
            message: 'Ihr Termin wurde erfolgreich verschoben.',
        })
    } catch (error) {
        console.error('Reschedule POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
