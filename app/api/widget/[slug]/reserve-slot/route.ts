// app/api/widget/[slug]/reserve-slot/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { rateLimiters, checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/security/rate-limit'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const reserveSchema = z.object({
    service_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    staff_id: z.union([z.string().uuid(), z.literal('_any')]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
})

// POST /api/widget/[slug]/reserve-slot
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        // Rate limiting
        const rateLimitKey = getRateLimitKey(request, slug)
        const rateLimit = await checkRateLimit(rateLimiters.widgetReserve, rateLimitKey)

        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }

        const body = await request.json()

        const validationResult = reserveSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const data = validationResult.data

        // Вычисляем startTime сразу после валидации
        const startTime = new Date(`${data.date}T${data.time}:00`)

        // Проверка что время в будущем
        if (startTime <= new Date()) {
            return NextResponse.json({
                error: 'TIME_PASSED',
                message: 'Dieser Zeitpunkt liegt in der Vergangenheit.'
            }, { status: 400 })
        }

        // Получаем tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        // Очистка просроченных holds
        await supabaseAdmin.rpc('cleanup_expired_holds')

        // Получаем услугу
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('id, duration, buffer_after, price, min_advance_hours, max_advance_days')
            .eq('id', data.service_id)
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Проверка min_advance_hours
        const minAdvanceHours = service.min_advance_hours ?? 0
        const minBookingTime = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)

        if (startTime < minBookingTime) {
            return NextResponse.json({
                error: 'TOO_SOON',
                message: `Buchungen müssen mindestens ${minAdvanceHours} Stunden im Voraus erfolgen.`
            }, { status: 400 })
        }

        // Проверка max_advance_days
        const maxAdvanceDays = service.max_advance_days ?? 90
        const maxBookingTime = new Date()
        maxBookingTime.setDate(maxBookingTime.getDate() + maxAdvanceDays)
        maxBookingTime.setHours(23, 59, 59, 999)

        if (startTime > maxBookingTime) {
            return NextResponse.json({
                error: 'TOO_FAR',
                message: `Buchungen können maximal ${maxAdvanceDays} Tage im Voraus erfolgen.`
            }, { status: 400 })
        }

        // Если есть вариант — берём его данные
        let duration = service.duration

        if (data.variant_id) {
            const { data: variant } = await supabaseAdmin
                .from('service_variants')
                .select('duration, price')
                .eq('id', data.variant_id)
                .eq('service_id', data.service_id)
                .single()

            if (variant) {
                duration = variant.duration
            }
        }

        const totalDuration = duration + (service.buffer_after || 0)
        const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

        // Генерируем уникальный токен сессии
        const sessionToken = randomBytes(32).toString('hex')

        const isAnyStaff = data.staff_id === '_any'
        let assignedStaffId: string
        let assignedStaffName: string | null = null

        if (isAnyStaff) {
            // Находим всех мастеров, которые могут выполнить услугу
            const { data: staffServices } = await supabaseAdmin
                .from('staff_services')
                .select('staff_id')
                .eq('service_id', data.service_id)

            if (!staffServices || staffServices.length === 0) {
                return NextResponse.json({
                    error: 'NO_STAFF',
                    message: 'Kein Mitarbeiter für diesen Service verfügbar.'
                }, { status: 404 })
            }

            const { data: activeStaff } = await supabaseAdmin
                .from('staff')
                .select('id, name')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true)
                .in('id', staffServices.map(ss => ss.staff_id))

            if (!activeStaff || activeStaff.length === 0) {
                return NextResponse.json({
                    error: 'NO_STAFF',
                    message: 'Kein Mitarbeiter verfügbar.'
                }, { status: 404 })
            }

            // Проверяем blocked_dates
            const { data: blockedDates } = await supabaseAdmin
                .from('blocked_dates')
                .select('staff_id')
                .eq('tenant_id', tenant.id)
                .eq('blocked_date', data.date)
                .in('staff_id', activeStaff.map(s => s.id))

            const blockedStaffIds = new Set((blockedDates || []).map(b => b.staff_id))
            const availableStaff = activeStaff.filter(s => !blockedStaffIds.has(s.id))

            if (availableStaff.length === 0) {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Kein Mitarbeiter an diesem Tag verfügbar.'
                }, { status: 409 })
            }

            // Проверяем расписание и занятость для каждого мастера
            const dayOfWeek = (new Date(data.date).getDay() + 6) % 7

            const { data: schedules } = await supabaseAdmin
                .from('staff_schedule')
                .select('*')
                .in('staff_id', availableStaff.map(s => s.id))
                .eq('day_of_week', dayOfWeek)

            const scheduleByStaff = new Map<string, NonNullable<typeof schedules>[number]>()
            schedules?.forEach(s => scheduleByStaff.set(s.staff_id, s))

            // Ищем первого свободного мастера
            let foundStaff: { id: string; name: string } | null = null

            for (const staff of availableStaff) {
                const schedule = scheduleByStaff.get(staff.id)
                if (!schedule || !schedule.is_working) continue

                const [startH, startM] = schedule.start_time.split(':').map(Number)
                const [endH, endM] = schedule.end_time.split(':').map(Number)
                const workStart = startH * 60 + startM
                const workEnd = endH * 60 + endM

                const [slotH, slotM] = data.time.split(':').map(Number)
                const slotMinutes = slotH * 60 + slotM

                // Слот не влезает в рабочий день
                if (slotMinutes < workStart || slotMinutes + totalDuration > workEnd) continue

                // Проверяем перерыв
                if (schedule.break_start && schedule.break_end) {
                    const [bsH, bsM] = schedule.break_start.split(':').map(Number)
                    const [beH, beM] = schedule.break_end.split(':').map(Number)
                    const breakStart = bsH * 60 + bsM
                    const breakEnd = beH * 60 + beM
                    if (slotMinutes < breakEnd && slotMinutes + totalDuration > breakStart) continue
                }

                // Проверяем конфликт с существующими бронями
                const { data: conflict } = await supabaseAdmin
                    .from('bookings')
                    .select('id')
                    .eq('staff_id', staff.id)
                    .in('status', ['pending', 'confirmed'])
                    .lt('start_time', endTime.toISOString())
                    .gt('end_time', startTime.toISOString())
                    .limit(1)
                    .single()

                if (conflict) continue

                // Проверяем конфликт с holds
                const { data: holdConflict } = await supabaseAdmin
                    .from('slot_holds')
                    .select('id')
                    .eq('staff_id', staff.id)
                    .lt('start_time', endTime.toISOString())
                    .gt('end_time', startTime.toISOString())
                    .gt('expires_at', new Date().toISOString())
                    .limit(1)
                    .single()

                if (holdConflict) continue

                foundStaff = staff
                break
            }

            if (!foundStaff) {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist bei keinem Mitarbeiter mehr verfügbar.'
                }, { status: 409 })
            }

            assignedStaffId = foundStaff.id
            assignedStaffName = foundStaff.name
        } else {
            assignedStaffId = data.staff_id

            // Проверяем нет ли уже реального бронирования на это время
            const { data: existingBooking } = await supabaseAdmin
                .from('bookings')
                .select('id')
                .eq('staff_id', assignedStaffId)
                .in('status', ['pending', 'confirmed'])
                .lt('start_time', endTime.toISOString())
                .gt('end_time', startTime.toISOString())
                .limit(1)
                .single()

            if (existingBooking) {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist bereits gebucht.'
                }, { status: 409 })
            }
        }

        // Создаём hold в slot_holds
        const { data: hold, error: holdError } = await supabaseAdmin
            .from('slot_holds')
            .insert({
                tenant_id: tenant.id,
                service_id: data.service_id,
                variant_id: data.variant_id || null,
                staff_id: assignedStaffId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                expires_at: expiresAt.toISOString(),
                session_token: sessionToken,
            })
            .select('id, expires_at, session_token')
            .single()

        if (holdError) {
            console.error('Hold creation error:', holdError)

            // Exclusion constraint = слот уже заблокирован
            if (holdError.code === '23P01') {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist bereits reserviert.'
                }, { status: 409 })
            }

            return NextResponse.json({
                error: 'RESERVATION_FAILED',
                message: 'Reservierung fehlgeschlagen.'
            }, { status: 500 })
        }

        return NextResponse.json({
            hold: {
                id: hold.id,
                session_token: hold.session_token,
                expires_at: hold.expires_at,
            },
            ...(assignedStaffName ? { assigned_staff_name: assignedStaffName } : {}),
            message: 'Zeitslot reserviert. Sie haben 15 Minuten.'
        }, { status: 201 })

    } catch (error) {
        console.error('Reserve slot error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}