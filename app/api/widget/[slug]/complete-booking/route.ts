// app/api/widget/[slug]/complete-booking/route.ts
// ШАГ 2: Завершение бронирования (добавление данных клиента)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const completeSchema = z.object({
    reservation_id: z.string().uuid(),
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

        // Проверяем что резервация существует и ещё не истекла
        const { data: reservation } = await supabaseAdmin
            .from('bookings')
            .select('id, status, expires_at, start_time, end_time')
            .eq('id', data.reservation_id)
            .eq('tenant_id', tenant.id)
            .eq('status', 'pending')
            .single()

        if (!reservation) {
            return NextResponse.json({
                error: 'RESERVATION_NOT_FOUND',
                message: 'Reservierung nicht gefunden oder abgelaufen.'
            }, { status: 404 })
        }

        const expiresAt = reservation.expires_at
        if (!expiresAt) {
            return NextResponse.json({
                error: 'RESERVATION_INVALID',
                message: 'Ungültige Reservierung.'
            }, { status: 400 })
        }

        if (new Date(expiresAt) < new Date()) {
            // Отменяем просроченную
            await supabaseAdmin
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', data.reservation_id)

            return NextResponse.json({
                error: 'RESERVATION_EXPIRED',
                message: 'Die Reservierung ist abgelaufen. Bitte buchen Sie erneut.'
            }, { status: 410 })
        }

        // Обновляем данные клиента + подтверждаем
        const { data: booking, error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({
                client_name: data.client_name,
                client_phone: data.client_phone,
                client_email: data.client_email || null,
                notes: data.notes || null,
                status: 'confirmed',
                expires_at: null, // Убираем TTL
            })
            .eq('id', data.reservation_id)
            .select('id, start_time, end_time, status')
            .single()

        if (updateError) {
            console.error('Complete booking error:', updateError)
            return NextResponse.json({
                error: 'BOOKING_FAILED',
                message: 'Buchung fehlgeschlagen.'
            }, { status: 500 })
        }

        return NextResponse.json({
            booking: {
                id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status, // 'confirmed'
            },
            message: 'Buchung erfolgreich bestätigt!'
        }, { status: 200 })

    } catch (error) {
        console.error('Complete booking error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}