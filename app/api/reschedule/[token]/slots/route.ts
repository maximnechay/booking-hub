// app/api/reschedule/[token]/slots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimiters, checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/security/rate-limit'

interface RouteParams {
    params: Promise<{ token: string }>
}

// GET /api/reschedule/[token]/slots?date=2025-02-10
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

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')

        if (!date) {
            return NextResponse.json({ error: 'date is required' }, { status: 400 })
        }

        // Получаем booking по токену
        const { data: booking, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                staff_id,
                service_id,
                variant_id,
                start_time,
                end_time,
                was_rescheduled,
                service:services(duration, buffer_after, min_advance_hours, max_advance_days),
                variant:service_variants(duration),
                tenant:tenants(id, is_active)
            `)
            .eq('reschedule_token', token)
            .single()

        if (error || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Проверяем что перенос возможен
        if (booking.was_rescheduled || booking.status !== 'confirmed') {
            return NextResponse.json({ slots: [], reason: 'Verschieben nicht möglich' })
        }

        const tenant = booking.tenant as { id: string; is_active: boolean } | null
        if (!tenant?.is_active) {
            return NextResponse.json({ slots: [], reason: 'Salon nicht verfügbar' })
        }

        const service = booking.service as { duration: number; buffer_after: number | null; min_advance_hours: number | null; max_advance_days: number | null } | null
        const variant = booking.variant as { duration: number } | null

        const duration = variant?.duration || service?.duration || 60
        const totalDuration = duration + (service?.buffer_after || 0)
        const minAdvanceHours = service?.min_advance_hours ?? 0
        const maxAdvanceDays = service?.max_advance_days ?? 90

        // Проверка max_advance_days
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
        const requestedDate = new Date(date)

        if (requestedDate > maxDate) {
            return NextResponse.json({
                slots: [],
                reason: 'Datum zu weit in der Zukunft',
            })
        }

        // Очистка просроченных holds
        await supabaseAdmin.rpc('cleanup_expired_holds')

        // День недели (0 = Понедельник)
        const dateObj = new Date(date)
        const dayOfWeek = (dateObj.getDay() + 6) % 7

        // Проверяем blocked_dates для салона
        const { data: salonBlocked } = await supabaseAdmin
            .from('blocked_dates')
            .select('id')
            .eq('tenant_id', tenant.id)
            .is('staff_id', null)
            .eq('blocked_date', date)
            .single()

        if (salonBlocked) {
            return NextResponse.json({ slots: [], reason: 'Salon geschlossen' })
        }

        // Проверяем blocked_dates для мастера
        const { data: staffBlocked } = await supabaseAdmin
            .from('blocked_dates')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('staff_id', booking.staff_id)
            .eq('blocked_date', date)
            .single()

        if (staffBlocked) {
            return NextResponse.json({ slots: [], reason: 'Mitarbeiter nicht verfügbar' })
        }

        // Расписание мастера
        const { data: schedule } = await supabaseAdmin
            .from('staff_schedule')
            .select('*')
            .eq('staff_id', booking.staff_id)
            .eq('day_of_week', dayOfWeek)
            .single()

        if (!schedule || !schedule.is_working) {
            return NextResponse.json({ slots: [], reason: 'Kein Arbeitstag' })
        }

        // Существующие брони (исключаем текущую запись!)
        const dayStart = `${date}T00:00:00`
        const dayEnd = `${date}T23:59:59`

        const { data: bookings } = await supabaseAdmin
            .from('bookings')
            .select('start_time, end_time')
            .eq('staff_id', booking.staff_id)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .in('status', ['pending', 'confirmed'])
            .neq('id', booking.id) // исключаем текущую запись

        // Активные holds
        const { data: holds } = await supabaseAdmin
            .from('slot_holds')
            .select('start_time, end_time')
            .eq('staff_id', booking.staff_id)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .gt('expires_at', new Date().toISOString())

        const occupiedSlots = [
            ...(bookings || []),
            ...(holds || []),
        ]

        // Генерируем слоты
        const slots: string[] = []
        const slotInterval = 15

        const [startHour, startMin] = schedule.start_time.split(':').map(Number)
        const [endHour, endMin] = schedule.end_time.split(':').map(Number)

        let breakStart: number | null = null
        let breakEnd: number | null = null

        if (schedule.break_start && schedule.break_end) {
            const [bsH, bsM] = schedule.break_start.split(':').map(Number)
            const [beH, beM] = schedule.break_end.split(':').map(Number)
            breakStart = bsH * 60 + bsM
            breakEnd = beH * 60 + beM
        }

        const workStart = startHour * 60 + startMin
        const workEnd = endHour * 60 + endMin

        // Минимальное время с учётом min_advance_hours
        const minBookingTime = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)

        for (let time = workStart; time + totalDuration <= workEnd; time += slotInterval) {
            const hours = String(Math.floor(time / 60)).padStart(2, '0')
            const mins = String(time % 60).padStart(2, '0')
            const slotDateTime = new Date(`${date}T${hours}:${mins}:00`)

            // Проверяем min_advance_hours
            if (slotDateTime < minBookingTime) {
                continue
            }

            // Проверяем перерыв
            if (breakStart !== null && breakEnd !== null) {
                const slotEnd = time + totalDuration
                if (time < breakEnd && slotEnd > breakStart) {
                    continue
                }
            }

            // Проверяем пересечение с занятыми слотами
            const slotStart = slotDateTime
            const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000)

            let isAvailable = true

            for (const occupied of occupiedSlots) {
                const occStart = new Date(occupied.start_time)
                const occEnd = new Date(occupied.end_time)

                if (slotStart < occEnd && slotEnd > occStart) {
                    isAvailable = false
                    break
                }
            }

            if (isAvailable) {
                slots.push(`${hours}:${mins}`)
            }
        }

        return NextResponse.json({ slots })
    } catch (error) {
        console.error('Reschedule slots error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
