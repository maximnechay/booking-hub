// app/api/widget/[slug]/availability/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET /api/widget/[slug]/availability?service_id=xxx&staff_id=xxx&from=2025-01-01&to=2025-01-31
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')
        const staffId = searchParams.get('staff_id')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const isAnyStaff = staffId === '_any'

        if (!serviceId || !staffId || !from || !to) {
            return NextResponse.json({
                error: 'service_id, staff_id, from and to are required'
            }, { status: 400 })
        }

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

        // Максимальная дата для бронирования
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
        maxDate.setHours(23, 59, 59, 999)

        // Определяем список staff_id для проверки
        let staffIds: string[] = []
        if (isAnyStaff) {
            const { data: staffServices } = await supabaseAdmin
                .from('staff_services')
                .select('staff_id')
                .eq('service_id', serviceId)

            if (!staffServices || staffServices.length === 0) {
                const fromDate = new Date(from)
                const toDate = new Date(to)
                const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
                const unavailable: string[] = []
                for (let offset = 0; offset < diffDays; offset++) {
                    const current = new Date(fromDate.getTime() + offset * 86400000)
                    unavailable.push(current.toISOString().slice(0, 10))
                }
                return NextResponse.json({ unavailable })
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
            const fromDate = new Date(from)
            const toDate = new Date(to)
            const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
            const unavailable: string[] = []
            for (let offset = 0; offset < diffDays; offset++) {
                const current = new Date(fromDate.getTime() + offset * 86400000)
                unavailable.push(current.toISOString().slice(0, 10))
            }
            return NextResponse.json({ unavailable })
        }

        type ScheduleRow = {
            staff_id: string
            day_of_week: number
            start_time: string
            end_time: string
            break_start: string | null
            break_end: string | null
            is_working: boolean | null
        }

        const { data: scheduleRows } = await supabaseAdmin
            .from('staff_schedule')
            .select('*')
            .in('staff_id', staffIds)

        const scheduleByStaffAndDay = new Map<string, Map<number, ScheduleRow>>()
        scheduleRows?.forEach(row => {
            if (!scheduleByStaffAndDay.has(row.staff_id)) {
                scheduleByStaffAndDay.set(row.staff_id, new Map())
            }
            scheduleByStaffAndDay.get(row.staff_id)!.set(row.day_of_week, row)
        })

        const blockedFilter = isAnyStaff
            ? `staff_id.is.null,staff_id.in.(${staffIds.join(',')})`
            : `staff_id.is.null,staff_id.eq.${staffId}`

        const { data: blockedDates } = await supabaseAdmin
            .from('blocked_dates')
            .select('blocked_date, staff_id')
            .eq('tenant_id', tenant.id)
            .gte('blocked_date', from)
            .lte('blocked_date', to)
            .or(blockedFilter)

        const blockedSalon = new Set(
            (blockedDates || [])
                .filter(item => !item.staff_id)
                .map(item => item.blocked_date)
        )
        const blockedByStaff = new Map<string, Set<string>>()
        ;(blockedDates || [])
            .filter(item => item.staff_id)
            .forEach(item => {
                const sid = item.staff_id!
                if (!blockedByStaff.has(sid)) {
                    blockedByStaff.set(sid, new Set())
                }
                blockedByStaff.get(sid)!.add(item.blocked_date)
            })

        const dayStart = `${from}T00:00:00`
        const dayEnd = `${to}T23:59:59`

        const { data: bookings } = await supabaseAdmin
            .from('bookings')
            .select('staff_id, start_time, end_time')
            .in('staff_id', staffIds)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .in('status', ['pending', 'confirmed'])

        const { data: holds } = await supabaseAdmin
            .from('slot_holds')
            .select('staff_id, start_time, end_time')
            .in('staff_id', staffIds)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .gt('expires_at', new Date().toISOString())

        const occupiedByStaffAndDate = new Map<string, Map<string, { start_time: string; end_time: string }[]>>()
        const allOccupied = [...(bookings || []), ...(holds || [])]
        allOccupied.forEach(item => {
            const sId = (item as any).staff_id as string
            const dateKey = item.start_time.slice(0, 10)
            if (!occupiedByStaffAndDate.has(sId)) {
                occupiedByStaffAndDate.set(sId, new Map())
            }
            const staffMap = occupiedByStaffAndDate.get(sId)!
            const list = staffMap.get(dateKey) || []
            list.push(item)
            staffMap.set(dateKey, list)
        })

        const fromDate = new Date(from)
        const toDate = new Date(to)
        const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1

        const unavailable: string[] = []
        const slotInterval = 15
        const minBookingTime = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)

        for (let offset = 0; offset < diffDays; offset += 1) {
            const current = new Date(fromDate.getTime() + offset * 86400000)
            const dateStr = current.toISOString().slice(0, 10)

            if (current > maxDate) {
                unavailable.push(dateStr)
                continue
            }

            if (blockedSalon.has(dateStr)) {
                unavailable.push(dateStr)
                continue
            }

            const dayOfWeek = (current.getDay() + 6) % 7
            let dateHasSlots = false

            for (const sId of staffIds) {
                if (blockedByStaff.get(sId)?.has(dateStr)) continue

                const schedule = scheduleByStaffAndDay.get(sId)?.get(dayOfWeek)
                if (!schedule || !schedule.is_working) continue

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

                const dayOccupied = occupiedByStaffAndDate.get(sId)?.get(dateStr) || []

                for (let time = workStart; time + totalDuration <= workEnd; time += slotInterval) {
                    const slotDateTime = new Date(`${dateStr}T${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}:00`)
                    if (slotDateTime < minBookingTime) continue

                    if (breakStart !== null && breakEnd !== null) {
                        const slotEnd = time + totalDuration
                        if (time < breakEnd && slotEnd > breakStart) continue
                    }

                    const slotStart = slotDateTime
                    const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000)

                    let isAvailable = true
                    for (const occupied of dayOccupied) {
                        const occStart = new Date(occupied.start_time)
                        const occEnd = new Date(occupied.end_time)
                        if (slotStart < occEnd && slotEnd > occStart) {
                            isAvailable = false
                            break
                        }
                    }

                    if (isAvailable) {
                        dateHasSlots = true
                        break
                    }
                }

                if (dateHasSlots) break
            }

            if (!dateHasSlots) {
                unavailable.push(dateStr)
            }
        }

        return NextResponse.json({ unavailable })
    } catch (error) {
        console.error('Widget availability error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}