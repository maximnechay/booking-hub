// app/api/widget/[slug]/availability/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const MAX_RANGE_DAYS = 62

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')
        const staffId = searchParams.get('staff_id')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        if (!serviceId || !staffId || !from || !to) {
            return NextResponse.json({
                error: 'service_id, staff_id, from and to are required'
            }, { status: 400 })
        }

        if (!dateRegex.test(from) || !dateRegex.test(to)) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
        }

        const fromDate = new Date(from)
        const toDate = new Date(to)

        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
        }

        const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
        if (diffDays <= 0 || diffDays > MAX_RANGE_DAYS) {
            return NextResponse.json({ error: 'Date range too large' }, { status: 400 })
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

        const { data: service } = await supabaseAdmin
            .from('services')
            .select('duration, buffer_after')
            .eq('id', serviceId)
            .eq('tenant_id', tenant.id)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        const totalDuration = service.duration + (service.buffer_after || 0)

        const { data: scheduleRows } = await supabaseAdmin
            .from('staff_schedule')
            .select('*')
            .eq('staff_id', staffId)

        const scheduleByDay = new Map<number, typeof scheduleRows[number]>()
        scheduleRows?.forEach(row => scheduleByDay.set(row.day_of_week, row))

        const { data: blockedDates } = await supabaseAdmin
            .from('blocked_dates')
            .select('blocked_date, staff_id')
            .eq('tenant_id', tenant.id)
            .gte('blocked_date', from)
            .lte('blocked_date', to)
            .or(`staff_id.is.null,staff_id.eq.${staffId}`)

        const blockedSalon = new Set(
            (blockedDates || [])
                .filter(item => !item.staff_id)
                .map(item => item.blocked_date)
        )
        const blockedStaff = new Set(
            (blockedDates || [])
                .filter(item => item.staff_id === staffId)
                .map(item => item.blocked_date)
        )

        const dayStart = `${from}T00:00:00`
        const dayEnd = `${to}T23:59:59`

        const { data: bookings } = await supabaseAdmin
            .from('bookings')
            .select('start_time, end_time')
            .eq('staff_id', staffId)
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd)
            .in('status', ['pending', 'confirmed'])

        const bookingsByDate = new Map<string, { start_time: string; end_time: string }[]>()
        bookings?.forEach(booking => {
            const dateKey = booking.start_time.slice(0, 10)
            const list = bookingsByDate.get(dateKey) || []
            list.push(booking)
            bookingsByDate.set(dateKey, list)
        })

        const unavailable: string[] = []
        const slotInterval = 15
        const today = new Date().toISOString().split('T')[0]
        const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes()

        for (let offset = 0; offset < diffDays; offset += 1) {
            const current = new Date(fromDate.getTime() + offset * 86400000)
            const dateStr = current.toISOString().slice(0, 10)

            if (blockedSalon.has(dateStr) || blockedStaff.has(dateStr)) {
                unavailable.push(dateStr)
                continue
            }

            const dayOfWeek = (current.getDay() + 6) % 7
            const schedule = scheduleByDay.get(dayOfWeek)

            if (!schedule || !schedule.is_working) {
                unavailable.push(dateStr)
                continue
            }

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

            const dayBookings = bookingsByDate.get(dateStr) || []
            let hasSlots = false

            for (let time = workStart; time + totalDuration <= workEnd; time += slotInterval) {
                if (dateStr === today && time <= currentMinutes) {
                    continue
                }

                if (breakStart !== null && breakEnd !== null) {
                    const slotEnd = time + totalDuration
                    if (time < breakEnd && slotEnd > breakStart) {
                        continue
                    }
                }

                const slotStart = new Date(`${dateStr}T${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}:00`)
                const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000)

                let isAvailable = true
                for (const booking of dayBookings) {
                    const bookingStart = new Date(booking.start_time)
                    const bookingEnd = new Date(booking.end_time)
                    if (slotStart < bookingEnd && slotEnd > bookingStart) {
                        isAvailable = false
                        break
                    }
                }

                if (isAvailable) {
                    hasSlots = true
                    break
                }
            }

            if (!hasSlots) {
                unavailable.push(dateStr)
            }
        }

        return NextResponse.json({ unavailable })
    } catch (error) {
        console.error('Widget availability error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
