// app/api/widget/[slug]/complete-booking/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendBookingConfirmation } from '@/lib/email/send-booking-confirmation'
import { sendAdminBookingNotification } from '@/lib/email/send-admin-notification'
import { rateLimiters, checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/security/rate-limit'
import { PlanService } from '@/lib/services/plan-service'

function generateCancelToken(): string {
    return randomBytes(32).toString('base64url')
}

function generateRescheduleToken(): string {
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
    consent_given_at: z.string().datetime(),
    turnstile_token: z.string().min(1),
    website: z.string().optional(),
    form_started_at: z.number().optional(),
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

        // Honeypot check
        if (data.website && data.website.length > 0) {
            console.log('[ANTIBOT] Honeypot triggered:', getRateLimitKey(request, slug))
            return NextResponse.json({
                error: 'BOOKING_FAILED',
                message: 'Buchung fehlgeschlagen.'
            }, { status: 400 })
        }

        // Timing check
        const MIN_FORM_TIME_MS = 3000
        if (data.form_started_at) {
            const formDuration = Date.now() - data.form_started_at
            if (formDuration < MIN_FORM_TIME_MS) {
                console.log('[ANTIBOT] Timing check failed:', formDuration, 'ms')
                return NextResponse.json({
                    error: 'BOOKING_FAILED',
                    message: 'Buchung fehlgeschlagen.'
                }, { status: 400 })
            }
        }

        // Verify Turnstile token
        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: data.turnstile_token,
            }),
        })
        const turnstileData = await turnstileRes.json()

        if (turnstileData.success !== true) {
            return NextResponse.json({
                error: 'CAPTCHA_FAILED',
                message: 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
            }, { status: 400 })
        }

        // Получаем tenant с данными для email
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id, name, email, address, phone')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        // Проверка лимита букингов
        const bookingLimit = await PlanService.checkBookingLimit(tenant.id)
        if (!bookingLimit.allowed) {
            return NextResponse.json({
                error: 'BOOKING_LIMIT_REACHED',
                message: 'Das monatliche Buchungslimit dieses Salons wurde erreicht. Bitte kontaktieren Sie den Salon.'
            }, { status: 403 })
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

        // Создаём реальный booking с токенами отмены и переноса
        const cancelToken = generateCancelToken()
        const rescheduleToken = generateRescheduleToken()

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
                reschedule_token: rescheduleToken,
                consent_given_at: data.consent_given_at,
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

        // Отправляем email владельцу салона (async)
        sendAdminBookingNotification({
            ownerEmail: tenant.email,
            salonName: tenant.name,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            clientEmail: data.client_email || null,
            serviceName: serviceName,
            staffName: staffMember?.name || 'Mitarbeiter',
            startTime: new Date(hold.start_time),
            duration: duration,
            price: price,
        }).then(result => {
            if (result.success) {
                console.log(`📧 Admin notification sent for booking ${booking.id}`)
            } else {
                console.error(`📧 Failed to send admin notification for booking ${booking.id}:`, result.error)
            }
        })

        // Отправляем email клиенту (async, не блокируем ответ)
        if (data.client_email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking-hub.vercel.app'
            const cancelUrl = `${baseUrl}/cancel/${cancelToken}`
            const rescheduleUrl = `${baseUrl}/reschedule/${rescheduleToken}`

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
                rescheduleUrl,
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