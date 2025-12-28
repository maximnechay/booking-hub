// app/api/widget/[slug]/complete-booking/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const completeSchema = z.object({
    hold_id: z.string().uuid(),
    session_token: z.string().min(1),
    client_name: z.string().min(2).max(100),
    client_phone: z.string().min(5).max(50),
    client_email: z.string().email().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
})

// POST /api/widget/[slug]/complete-booking
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const body = await request.json()

        const validationResult = completeSchema.safeParse(body)
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

        // Получаем hold и проверяем session_token
        const { data: hold } = await supabaseAdmin
            .from('slot_holds')
            .select('*')
            .eq('id', data.hold_id)
            .eq('tenant_id', tenant.id)
            .eq('session_token', data.session_token)
            .single()

        if (!hold) {
            return NextResponse.json({
                error: 'HOLD_NOT_FOUND',
                message: 'Reservierung nicht gefunden oder ungültig.'
            }, { status: 404 })
        }

        // Проверяем не истёк ли hold
        if (new Date(hold.expires_at) < new Date()) {
            // Удаляем просроченный hold
            await supabaseAdmin
                .from('slot_holds')
                .delete()
                .eq('id', hold.id)

            return NextResponse.json({
                error: 'HOLD_EXPIRED',
                message: 'Die Reservierung ist abgelaufen. Bitte buchen Sie erneut.'
            }, { status: 410 })
        }

        // Получаем данные услуги для сохранения цены/длительности
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('duration, price, buffer_after')
            .eq('id', hold.service_id)
            .single()

        let duration = service?.duration || 60
        let price = service?.price || 0

        // Если есть вариант
        if (hold.variant_id) {
            const { data: variant } = await supabaseAdmin
                .from('service_variants')
                .select('duration, price')
                .eq('id', hold.variant_id)
                .single()

            if (variant) {
                duration = variant.duration
                price = variant.price
            }
        }

        // Создаём реальный booking
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                tenant_id: tenant.id,
                service_id: hold.service_id,
                variant_id: hold.variant_id,
                staff_id: hold.staff_id,
                client_name: data.client_name,
                client_phone: data.client_phone,
                client_email: data.client_email || null,
                notes: data.notes || null,
                start_time: hold.start_time,
                end_time: hold.end_time,
                status: 'confirmed',
                price_at_booking: price,
                duration_at_booking: duration,
                source: 'widget',
            })
            .select('id, start_time, end_time, status')
            .single()

        if (bookingError) {
            console.error('Booking creation error:', bookingError)

            // Если конфликт — слот уже занят
            if (bookingError.code === '23P01') {
                // Удаляем hold
                await supabaseAdmin
                    .from('slot_holds')
                    .delete()
                    .eq('id', hold.id)

                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot wurde bereits gebucht.'
                }, { status: 409 })
            }

            return NextResponse.json({
                error: 'BOOKING_FAILED',
                message: 'Buchung fehlgeschlagen.'
            }, { status: 500 })
        }

        // Удаляем hold — он больше не нужен
        await supabaseAdmin
            .from('slot_holds')
            .delete()
            .eq('id', hold.id)

        return NextResponse.json({
            booking: {
                id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status,
            },
            message: 'Buchung erfolgreich bestätigt!'
        }, { status: 201 })

    } catch (error) {
        console.error('Complete booking error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}