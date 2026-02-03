// app/api/widget/[slug]/slots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimiters, checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/security/rate-limit'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET /api/widget/[slug]/slots?service_id=xxx&staff_id=xxx&date=2025-01-15
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        // Rate limiting
        const rateLimitKey = getRateLimitKey(request, slug)
        const rateLimit = await checkRateLimit(rateLimiters.widgetSlots, rateLimitKey)

        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }

        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')
        const staffId = searchParams.get('staff_id')
        const date = searchParams.get('date')

        const isAnyStaff = staffId === '_any'

        if (!serviceId || !staffId || !date) {
            return NextResponse.json({
                error: 'service_id, staff_id and date are required'
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
            .select('duration, buffer_after, min_advance_hours, max_advance_days')
            .eq('id', serviceId)
            .eq('tenant_id', tenant.id)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        const totalDuration = service.duration + (service.buffer_after || 0)
        const minAdvanceHours = service.min_advance_hours ?? 0
        const maxAdvanceDays = service.max_advance_days ?? 90

        // Проверка max_advance_days — дата слишком далеко
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
        const requestedDate = new Date(date)

        if (requestedDate > maxDate) {
            return NextResponse.json({
                slots: [],
                reason: 'Datum zu weit in der Zukunft'
            })
        }

        // Получаем день недели (0 = Понедельник в нашей системе)
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

        // Определяем список мастеров
        let staffIds: string[] = []
        if (isAnyStaff) {
            const { data: staffServices } = await supabaseAdmin
                .from('staff_services')
                .select('staff_id')
                .eq('service_id', serviceId)

            if (!staffServices || staffServices.length === 0) {
                return NextResponse.json({ slots: [] })
            }

            const { data: activeStaff } = await supabaseAdmin
                .from('staff')
                .select('id')
                .eq('tenant_id', tenant.id)
                .eq('is_active', true)
                .in('id', staffServices.map(ss => ss.staff_id))

            staffIds = (activeStaff || []).map(s => s.id)
        } else {
            staffIds = [staffId!]
        }

        if (staffIds.length === 0) {
            return NextResponse.json({ slots: [] })
        }

        // Проверяем blocked_dates для мастеров
        const { data: staffBlockedDates } = await supabaseAdmin
            .from('blocked_dates')
            .select('staff_id')
            .eq('tenant_id', tenant.id)
            .eq('blocked_date', date)
            .in('staff_id', staffIds)

        const blockedStaffIds = new Set((staffBlockedDates || []).map(b => b.staff_id))
        const availableStaffIds = staffIds.filter(id => !blockedStaffIds.has(id))

        if (availableStaffIds.length === 0) {
            return NextResponse.json({ slots: [], reason: isAnyStaff ? 'Keine Mitarbeiter verfügbar' : 'Mitarbeiter nicht verfügbar' })
        }

        // Получаем расписания мастеров на этот день
        const { data: schedules } = await supabaseAdmin
            .from('staff_schedule')
            .select('*')
            .in('staff_id', availableStaffIds)
            .eq('day_of_week', dayOfWeek)

        const scheduleByStaff = new Map<string, NonNullable<typeof schedules>[number]>()
        schedules?.forEach(s => scheduleByStaff.set(s.staff_id, s))

        const workingStaffIds = availableStaffIds.filter(id => {
            const s = scheduleByStaff.get(id)
            return s && s.is_working
        })

        if (workingStaffIds.length === 0) {
            return NextResponse.json({ slots: [], reason: 'Kein Arbeitstag' })
        }

        // Получаем существующие БРОНИ на этот день
        const dayStart = `${date}T00:00:00`
        const dayEnd = `${date}T23:59:59`

        const { data: bookings } = await supabaseAdmin
            .from('bookings')
            .select('staff_id, start_time, end_time')
            .in('staff_id', workingStaffIds)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .in('status', ['pending', 'confirmed'])

        const { data: holds } = await supabaseAdmin
            .from('slot_holds')
            .select('staff_id, start_time, end_time')
            .in('staff_id', workingStaffIds)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .gt('expires_at', new Date().toISOString())

        const occupiedByStaff = new Map<string, { start_time: string; end_time: string }[]>()
        ;[...(bookings || []), ...(holds || [])].forEach(item => {
            const sId = (item as any).staff_id as string
            const list = occupiedByStaff.get(sId) || []
            list.push(item)
            occupiedByStaff.set(sId, list)
        })

        const allSlots = new Set<string>()
        const slotInterval = 15
        const minBookingTime = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)

        for (const sId of workingStaffIds) {
            const schedule = scheduleByStaff.get(sId)!

            const [startHour, startMin] = schedule.start_time.split(':').map(Number)
            const [endHour, endMin] = schedule.end_time.split(':').map(Number)
            const workStart = startHour * 60 + startMin
            const workEnd = endHour * 60 + endMin

            let breakStart: number | null = null
            let breakEnd: number | null = null

            if (schedule.break_start && schedule.break_end) {
                const [bsH, bsM] = schedule.break_start.split(':').map(Number)
                const [beH, beM] = schedule.break_end.split(':').map(Number)
                breakStart = bsH * 60 + bsM
                breakEnd = beH * 60 + beM
            }

            const occupiedSlots = occupiedByStaff.get(sId) || []

            for (let time = workStart; time + totalDuration <= workEnd; time += slotInterval) {
                const slotDateTime = new Date(`${date}T${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}:00`)
                if (slotDateTime < minBookingTime) continue

                if (breakStart !== null && breakEnd !== null) {
                    const slotEnd = time + totalDuration
                    if (time < breakEnd && slotEnd > breakStart) continue
                }

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
                    const hours = String(Math.floor(time / 60)).padStart(2, '0')
                    const mins = String(time % 60).padStart(2, '0')
                    allSlots.add(`${hours}:${mins}`)
                }
            }
        }

        const slots = Array.from(allSlots).sort()
        return NextResponse.json({ slots })
    } catch (error) {
        console.error('Widget slots error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}