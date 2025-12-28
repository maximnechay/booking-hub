// app/api/widget/[slug]/reserve-slot/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { randomBytes } from 'crypto'

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

        // Очистка просроченных holds
        await supabaseAdmin.rpc('cleanup_expired_holds')

        // Получаем услугу
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('id, duration, buffer_after, price')
            .eq('id', data.service_id)
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .single()

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
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

        // Вычисляем время
        const startTime = new Date(`${data.date}T${data.time}:00`)

        // Проверка что время в будущем
        if (startTime <= new Date()) {
            return NextResponse.json({
                error: 'TIME_PASSED',
                message: 'Dieser Zeitpunkt liegt in der Vergangenheit.'
            }, { status: 400 })
        }

        const totalDuration = duration + (service.buffer_after || 0)
        const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

        // Генерируем уникальный токен сессии
        const sessionToken = randomBytes(32).toString('hex')

        // Проверяем нет ли уже реального бронирования на это время
        const { data: existingBooking } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('staff_id', data.staff_id)
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

        // Создаём hold в slot_holds
        const { data: hold, error: holdError } = await supabaseAdmin
            .from('slot_holds')
            .insert({
                tenant_id: tenant.id,
                service_id: data.service_id,
                variant_id: data.variant_id || null,
                staff_id: data.staff_id,
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
            message: 'Zeitslot reserviert. Sie haben 15 Minuten.'
        }, { status: 201 })

    } catch (error) {
        console.error('Reserve slot error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}