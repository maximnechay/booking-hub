// app/api/cron/send-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendBookingReminder } from '@/lib/email/send-booking-reminder'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const DEFAULT_TIME_ZONE = 'Europe/Berlin'
const REMINDER_HOUR_LOCAL = 17

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    const parts = dtf.formatToParts(date)
    const values = Object.fromEntries(parts.map(p => [p.type, p.value]))
    const asUtc = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
        Number(values.second)
    )
    return asUtc - date.getTime()
}

function getZonedDateParts(timeZone: string, date: Date): { year: number; month: number; day: number; hour: number } {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
    })
    const parts = dtf.formatToParts(date)
    const values = Object.fromEntries(parts.map(p => [p.type, p.value]))
    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        hour: Number(values.hour),
    }
}

function zonedMidnightToUtc(timeZone: string, year: number, month: number, day: number): Date {
    const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const offset = getTimeZoneOffsetMs(timeZone, utcGuess)
    return new Date(utcGuess.getTime() - offset)
}

export async function GET(request: NextRequest) {
    try {
        // Проверка Vercel Cron secret
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('[CRON] Unauthorized attempt')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const timeZone = process.env.REMINDER_TIME_ZONE || DEFAULT_TIME_ZONE
        const now = new Date()
        const localParts = getZonedDateParts(timeZone, now)

        console.log(`[CRON] Starting reminder emails for next day (${timeZone})...`)

        // Найти bookings для напоминания:
        // - status = confirmed
        // - start_time завтра по локальной TZ (от 00:00 до 23:59)
        // - reminder_sent_at IS NULL
        // - tenant имеет feature_reminder_24h
        const tomorrowLocal = new Date(Date.UTC(localParts.year, localParts.month - 1, localParts.day + 1, 0, 0, 0))
        const nextDayLocal = new Date(Date.UTC(localParts.year, localParts.month - 1, localParts.day + 2, 0, 0, 0))

        const startUtc = zonedMidnightToUtc(timeZone, tomorrowLocal.getUTCFullYear(), tomorrowLocal.getUTCMonth() + 1, tomorrowLocal.getUTCDate())
        const endUtc = zonedMidnightToUtc(timeZone, nextDayLocal.getUTCFullYear(), nextDayLocal.getUTCMonth() + 1, nextDayLocal.getUTCDate())

        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                client_name,
                client_email,
                start_time,
                end_time,
                duration_at_booking,
                cancel_token,
                tenant:tenants!inner(
                    id,
                    name,
                    email,
                    address,
                    phone,
                    plan:plans!inner(feature_reminder_24h)
                ),
                service:services(name),
                staff:staff(name)
            `)
            .eq('status', 'confirmed')
            .is('reminder_sent_at', null)
            .gte('start_time', startUtc.toISOString())
            .lt('start_time', endUtc.toISOString())

        if (error) {
            console.error('[CRON] Query error:', error)
            throw error
        }

        // Фильтруем только tenants с feature_reminder_24h
        const eligibleBookings = bookings?.filter(
            (b: Record<string, unknown>) => {
                const tenant = b.tenant as Record<string, unknown> | null
                const plan = tenant?.plan as Record<string, unknown> | null
                return plan?.feature_reminder_24h === true
            }
        ) || []

        console.log(`[CRON] Found ${eligibleBookings.length} bookings to remind`)

        let sent = 0
        let failed = 0

        for (const booking of eligibleBookings) {
            if (!booking.client_email) continue

            const startTime = new Date(booking.start_time)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking-hub.vercel.app'

            const tenant = booking.tenant as Record<string, unknown>
            const service = booking.service as Record<string, unknown> | null
            const staff = booking.staff as Record<string, unknown> | null

            const formatDuration = (minutes: number) => {
                if (minutes < 60) return `${minutes} Min.`
                const h = Math.floor(minutes / 60)
                const m = minutes % 60
                return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
            }

            const result = await sendBookingReminder({
                to: booking.client_email,
                clientName: booking.client_name,
                salonName: tenant.name as string,
                serviceName: (service?.name as string) || 'Service',
                staffName: (staff?.name as string) || 'Mitarbeiter',
                date: format(startTime, "EEEE, d. MMMM yyyy", { locale: de }),
                time: format(startTime, "HH:mm"),
                duration: formatDuration(booking.duration_at_booking),
                salonAddress: (tenant.address as string) || undefined,
                salonPhone: (tenant.phone as string) || undefined,
                cancelUrl: booking.cancel_token
                    ? `${baseUrl}/cancel/${booking.cancel_token}`
                    : undefined,
            })

            if (result.success) {
                // Обновляем reminder_sent_at
                await supabaseAdmin
                    .from('bookings')
                    .update({ reminder_sent_at: new Date().toISOString() })
                    .eq('id', booking.id)
                sent++
            } else {
                console.error(`[CRON] Failed to send reminder for booking ${booking.id}:`, result.error)
                failed++
            }
        }

        console.log(`[CRON] Reminders complete. Sent: ${sent}, Failed: ${failed}`)

        return NextResponse.json({
            success: true,
            sent,
            failed,
            total: eligibleBookings.length,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('[CRON] Reminder error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    return GET(request)
}
