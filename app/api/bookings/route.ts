// app/api/bookings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createBookingSchema } from '@/lib/validations/bookings'
import { randomBytes } from 'crypto'

// POST /api/bookings
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const body = await request.json()
        const validationResult = createBookingSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validierungsfehler',
                details: validationResult.error.flatten().fieldErrors,
            }, { status: 400 })
        }

        const data = validationResult.data

        // Staff может создавать только свои букинги
        if (userData.role === 'staff') {
            const { data: staffData } = await supabase
                .from('staff')
                .select('id')
                .eq('user_id', user.id)
                .eq('tenant_id', userData.tenant_id)
                .single()

            if (!staffData || data.staff_id !== staffData.id) {
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
            }
        }

        // Проверяем что staff и service принадлежат тенанту
        const { data: staffCheck } = await supabase
            .from('staff')
            .select('id')
            .eq('id', data.staff_id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!staffCheck) {
            return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 400 })
        }

        const { data: serviceCheck } = await supabase
            .from('services')
            .select('id')
            .eq('id', data.service_id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!serviceCheck) {
            return NextResponse.json({ error: 'Dienstleistung nicht gefunden' }, { status: 400 })
        }

        // Вычисляем start_time и end_time
        const startTime = new Date(`${data.date}T${data.time}:00`)
        const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000)

        const cancelToken = randomBytes(32).toString('base64url')
        const rescheduleToken = randomBytes(32).toString('base64url')

        const { data: booking, error: insertError } = await supabaseAdmin
            .from('bookings')
            .insert({
                tenant_id: userData.tenant_id,
                service_id: data.service_id,
                staff_id: data.staff_id,
                variant_id: data.variant_id || null,
                client_name: data.client_name,
                client_phone: data.client_phone,
                client_email: data.client_email || null,
                notes: data.notes || null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                price_at_booking: data.price,
                duration_at_booking: data.duration,
                source: 'dashboard',
                cancel_token: cancelToken,
                reschedule_token: rescheduleToken,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Booking insert error:', insertError)
            return NextResponse.json({ error: 'Fehler beim Erstellen des Termins' }, { status: 500 })
        }

        return NextResponse.json({ booking }, { status: 201 })
    } catch (error) {
        console.error('Booking POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
