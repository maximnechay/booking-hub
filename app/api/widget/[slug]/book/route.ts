// app/api/widget/[slug]/book/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import crypto from 'crypto'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const bookingSchema = z.object({
    service_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    staff_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    client_name: z.string().min(2).max(100),
    client_phone: z.string().min(5).max(50),
    client_email: z.string().email().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
})

// POST /api/widget/[slug]/book
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const body = await request.json()

        // Валидация
        const validationResult = bookingSchema.safeParse(body)
        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error.flatten())
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

        // Если есть вариант — используем его duration и price
        let duration = service.duration
        let price = service.price

        if (data.variant_id) {
            const { data: variant } = await supabaseAdmin
                .from('service_variants')
                .select('id, duration, price')
                .eq('id', data.variant_id)
                .eq('service_id', data.service_id)
                .eq('is_active', true)
                .single()

            if (!variant) {
                return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
            }

            duration = variant.duration
            price = variant.price
        }

        // Проверяем мастера
        const { data: staff } = await supabaseAdmin
            .from('staff')
            .select('id')
            .eq('id', data.staff_id)
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .single()

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        // Проверяем что мастер оказывает услугу
        const { data: staffService } = await supabaseAdmin
            .from('staff_services')
            .select('staff_id')
            .eq('staff_id', data.staff_id)
            .eq('service_id', data.service_id)
            .single()

        if (!staffService) {
            return NextResponse.json({ error: 'Staff does not provide this service' }, { status: 400 })
        }

        // Вычисляем время
        const startTime = new Date(`${data.date}T${data.time}:00`)
        const totalDuration = duration + (service.buffer_after || 0)
        const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

        // Проверяем что слот не в прошлом
        if (startTime <= new Date()) {
            return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 })
        }

        // Проверяем blocked_dates
        const { data: blocked } = await supabaseAdmin
            .from('blocked_dates')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('blocked_date', data.date)
            .or(`staff_id.is.null,staff_id.eq.${data.staff_id}`)

        if (blocked && blocked.length > 0) {
            return NextResponse.json({ error: 'Date is not available' }, { status: 400 })
        }

        // Проверяем пересечение с существующими бронями
        const { data: conflictingBookings } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('staff_id', data.staff_id)
            .in('status', ['pending', 'confirmed'])
            .lt('start_time', endTime.toISOString())
            .gt('end_time', startTime.toISOString())

        if (conflictingBookings && conflictingBookings.length > 0) {
            return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 409 })
        }

        // Генерируем confirmation code
        const confirmationCode = crypto.randomBytes(4).toString('hex').toUpperCase()
        const confirmationCodeHash = crypto
            .createHash('sha256')
            .update(confirmationCode)
            .digest('hex')

        // Создаём бронь
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                tenant_id: tenant.id,
                service_id: data.service_id,
                variant_id: data.variant_id || null,
                staff_id: data.staff_id,
                client_name: data.client_name,
                client_phone: data.client_phone,
                client_email: data.client_email || null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                confirmation_code_hash: confirmationCodeHash,
                notes: data.notes || null,
                price_at_booking: price,
                duration_at_booking: duration,
                source: 'widget',
            })
            .select('id, start_time, end_time, status')
            .single()

        if (bookingError) {
            console.error('Booking creation error:', bookingError)
            return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
        }

        return NextResponse.json({
            booking: {
                ...booking,
                confirmation_code: confirmationCode,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Widget book error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}