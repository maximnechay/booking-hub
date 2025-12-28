// app/api/widget/[slug]/reserve-slot/route.ts
// С АВТОМАТИЧЕСКИМ CLEANUP (для Vercel Free)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const reserveSchema = z.object({
    service_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    staff_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
})

// POST /api/widget/[slug]/reserve-slot
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const body = await request.json()

        // НОВОЕ: Cleanup просроченных pending перед резервацией
        try {
            await supabaseAdmin.rpc('cleanup_expired_pending')
        } catch (cleanupError) {
            // Игнорируем ошибки cleanup, продолжаем работу
            console.error('Cleanup error (non-critical):', cleanupError)
        }

        const validationResult = reserveSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const data = validationResult.data

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

        const startTime = new Date(`${data.date}T${data.time}:00`)

        // Получаем service для вычисления end_time
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('duration, buffer_after, price')
            .eq('id', data.service_id)
            .eq('tenant_id', tenant.id)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        let duration = service.duration
        let price = service.price

        if (data.variant_id) {
            const { data: variant } = await supabaseAdmin
                .from('service_variants')
                .select('duration, price')
                .eq('id', data.variant_id)
                .single()

            if (variant) {
                duration = variant.duration
                price = variant.price
            }
        }

        const totalDuration = duration + (service.buffer_after || 0)
        const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

        // Создаём PENDING резервацию БЕЗ данных клиента
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                tenant_id: tenant.id,
                service_id: data.service_id,
                variant_id: data.variant_id || null,
                staff_id: data.staff_id,
                client_name: 'RESERVED',
                client_phone: 'RESERVED',
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'pending',
                expires_at: expiresAt.toISOString(),
                price_at_booking: price,
                duration_at_booking: duration,
                source: 'widget',
            })
            .select('id, expires_at')
            .single()

        if (bookingError) {
            console.error('Reservation error:', bookingError)

            // Exclusion constraint = слот уже занят
            if (bookingError.code === '23P01') {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist bereits gebucht.'
                }, { status: 409 })
            }

            return NextResponse.json({
                error: 'RESERVATION_FAILED',
                message: 'Reservierung fehlgeschlagen.'
            }, { status: 500 })
        }

        return NextResponse.json({
            reservation: {
                id: booking.id,
                expires_at: booking.expires_at,
            },
            message: 'Zeitslot reserviert. Sie haben 15 Minuten.'
        }, { status: 201 })

    } catch (error) {
        console.error('Reserve slot error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}