// app/api/widget/[slug]/book/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

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

        // Вычисляем timestamp
        const startTime = new Date(`${data.date}T${data.time}:00`)

        const { data: result, error: bookingError } = await supabaseAdmin.rpc('create_booking_safe', {
            p_tenant_id: tenant.id,
            p_service_id: data.service_id,
            p_variant_id: (data.variant_id ?? null) as any,
            p_staff_id: data.staff_id,
            p_client_name: data.client_name,
            p_client_phone: data.client_phone,
            p_client_email: (data.client_email ?? null) as any,
            p_start_time: startTime.toISOString(),
            p_notes: (data.notes ?? null) as any,
        })

        if (bookingError) {
            console.error('Booking creation error:', bookingError)

            // Обрабатываем специфичные ошибки от функции
            const errorMessage = bookingError.message || ''

            // Exclusion constraint violation (двойная запись от race condition)
            if (errorMessage.includes('exclusion') || errorMessage.includes('conflicts with existing')) {
                return NextResponse.json({
                    error: 'SLOT_TAKEN',
                    message: 'Dieser Zeitslot ist bereits gebucht. Bitte wählen Sie einen anderen.'
                }, { status: 409 })
            }

            // Min advance hours (запись слишком рано)
            if (errorMessage.includes('too soon') || errorMessage.includes('Minimum advance')) {
                return NextResponse.json({
                    error: 'TOO_SOON',
                    message: 'Buchung zu kurzfristig. Bitte mindestens einige Stunden im Voraus buchen.'
                }, { status: 400 })
            }

            // Max advance days (запись слишком далеко)
            if (errorMessage.includes('too far') || errorMessage.includes('Maximum')) {
                return NextResponse.json({
                    error: 'TOO_FAR_AHEAD',
                    message: 'Buchung zu weit in der Zukunft. Bitte einen früheren Termin wählen.'
                }, { status: 400 })
            }

            // Время в прошлом
            if (errorMessage.includes('must be in the future')) {
                return NextResponse.json({
                    error: 'TIME_PASSED',
                    message: 'Dieser Zeitpunkt liegt in der Vergangenheit.'
                }, { status: 400 })
            }

            // Салон закрыт
            if (errorMessage.includes('closed')) {
                return NextResponse.json({
                    error: 'SALON_CLOSED',
                    message: 'Der Salon ist an diesem Tag geschlossen.'
                }, { status: 400 })
            }

            // Мастер недоступен
            if (errorMessage.includes('not available')) {
                return NextResponse.json({
                    error: 'STAFF_UNAVAILABLE',
                    message: 'Der Mitarbeiter ist an diesem Tag nicht verfügbar.'
                }, { status: 400 })
            }

            // Услуга не найдена или неактивна
            if (errorMessage.includes('not found') || errorMessage.includes('not available for booking')) {
                return NextResponse.json({
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Diese Dienstleistung ist nicht verfügbar.'
                }, { status: 404 })
            }

            // Общая ошибка
            return NextResponse.json({
                error: 'BOOKING_FAILED',
                message: 'Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.'
            }, { status: 500 })
        }

        // Функция возвращает массив с одним элементом
        if (!result || result.length === 0) {
            return NextResponse.json({
                error: 'BOOKING_FAILED',
                message: 'Buchung fehlgeschlagen.'
            }, { status: 500 })
        }

        const booking = result[0]

        // ВАЖНО: Теперь возвращаем status = 'pending'
        // Клиент должен подтвердить запись в течение 15 минут!
        return NextResponse.json({
            booking: {
                id: booking.booking_id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status, // 'pending'
            },
            message: 'Buchung erfolgreich erstellt.'
        }, { status: 201 })

    } catch (error) {
        console.error('Widget book error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}