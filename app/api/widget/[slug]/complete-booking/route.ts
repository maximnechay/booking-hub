// app/api/widget/[slug]/complete-booking/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendBookingConfirmation } from '@/lib/email/send-booking-confirmation'
import { rateLimiters, checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/security/rate-limit'

function generateCancelToken(): string {
    return randomBytes(32).toString('base64url')
}

interface RouteParams {
    params: Promise<{ slug: string }>
}

const completeSchema = z.object({
    hold_id: z.string().uuid(),
    session_token: z.string().min(1),
    client_name: z.string().min(2).max(100),
    client_phone: z.string().min(5).max(50),
    client_email: z.string().email(),
    notes: z.string().max(500).nullable().optional(),
})

// POST /api/widget/[slug]/complete-booking
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const rateLimitKey = getRateLimitKey(request, slug)
        const rateLimit = await checkRateLimit(rateLimiters.widgetComplete, rateLimitKey)

        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit)
        }
        const body = await request.json()

        const validationResult = completeSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const data = validationResult.data

        // Получаем tenant с данными для email
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id, name, address, phone')
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
            await supabaseAdmin
                .from('slot_holds')
                .delete()
                .eq('id', hold.id)

            return NextResponse.json({
                error: 'HOLD_EXPIRED',
                message: 'Die Reservierung ist abgelaufen. Bitte buchen Sie erneut.'
            }, { status: 410 })
        }

        // Получаем данные услуги
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('name, duration, price, buffer_after')
            .eq('id', hold.service_id)
            .single()

        let duration = service?.duration || 60
        let price = service?.price || 0
        let serviceName = service?.name || 'Service'

        // Если есть вариант
        if (hold.variant_id) {
            const { data: variant } = await supabaseAdmin
                .from('service_variants')
                .select('name, duration, price')
                .eq('id', hold.variant_id)
                .single()

            if (variant) {
                duration = variant.duration
                price = variant.price
                serviceName = `${serviceName} - ${variant.name}`
            }
        }

        // Получаем имя мастера
        const { data: staffMember } = await supabaseAdmin
            .from('staff')
            .select('name')
            .eq('id', hold.staff_id)
            .single()

        // Создаём реальный booking с токеном отмены
        const cancelToken = generateCancelToken()

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
                cancel_token: cancelToken,
            })
            .select('id, start_time, end_time, status')
            .single()

        if (bookingError) {
            console.error('Booking creation error:', bookingError)

            if (bookingError.code === '23P01') {
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

        // Удаляем hold
        await supabaseAdmin
            .from('slot_holds')
            .delete()
            .eq('id', hold.id)

        // Отправляем email (async, не блокируем ответ)
        if (data.client_email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking-hub.vercel.app'
            const cancelUrl = `${baseUrl}/cancel/${cancelToken}`

            sendBookingConfirmation({
                clientName: data.client_name,
                clientEmail: data.client_email,
                salonName: tenant.name,
                serviceName: serviceName,
                staffName: staffMember?.name || 'Mitarbeiter',
                startTime: new Date(hold.start_time),
                duration: duration,
                price: price,
                salonAddress: tenant.address || undefined,
                salonPhone: tenant.phone || undefined,
                cancelUrl,
            }).then(result => {
                if (result.success) {
                    console.log(`📧 Confirmation email sent for booking ${booking.id}`)
                } else {
                    console.error(`📧 Failed to send email for booking ${booking.id}:`, result.error)
                }
            })
        }

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