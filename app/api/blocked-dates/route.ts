// app/api/blocked-dates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBlockedDateSchema, createBlockedDateRangeSchema } from '@/lib/validations/blocked-dates'

// GET /api/blocked-dates?staff_id=xxx&from=2025-01-01&to=2025-12-31
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const staffId = searchParams.get('staff_id')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        let query = supabase
            .from('blocked_dates')
            .select('*, staff:staff(id, name)')
            .eq('tenant_id', userData.tenant_id)
            .order('blocked_date', { ascending: true })

        if (staffId) {
            query = query.eq('staff_id', staffId)
        }

        if (from) {
            query = query.gte('blocked_date', from)
        }

        if (to) {
            query = query.lte('blocked_date', to)
        }

        const { data: blockedDates, error } = await query

        if (error) {
            console.error('Blocked dates fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 })
        }

        return NextResponse.json({ blocked_dates: blockedDates })
    } catch (error) {
        console.error('Blocked dates GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/blocked-dates
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

        if (userData.role === 'staff') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const body = await request.json()

        // Проверяем это range или single date
        if (body.start_date && body.end_date) {
            // Range
            const validationResult = createBlockedDateRangeSchema.safeParse(body)

            if (!validationResult.success) {
                return NextResponse.json({
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors
                }, { status: 400 })
            }

            const { staff_id, start_date, end_date, reason } = validationResult.data

            // Проверяем staff_id если указан
            if (staff_id) {
                const { data: staff } = await supabase
                    .from('staff')
                    .select('id')
                    .eq('id', staff_id)
                    .eq('tenant_id', userData.tenant_id)
                    .single()

                if (!staff) {
                    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
                }
            }

            // Генерируем даты в диапазоне
            const dates: string[] = []
            const current = new Date(start_date)
            const end = new Date(end_date)

            while (current <= end) {
                dates.push(current.toISOString().split('T')[0])
                current.setDate(current.getDate() + 1)
            }

            // Вставляем все даты (игнорируем дубликаты)
            const rows = dates.map(date => ({
                tenant_id: userData.tenant_id,
                staff_id: staff_id || null,
                blocked_date: date,
                reason: reason || null,
            }))

            const { error } = await supabase
                .from('blocked_dates')
                .upsert(rows, { onConflict: 'tenant_id,staff_id,blocked_date' })

            if (error) {
                console.error('Blocked dates creation error:', error)
                return NextResponse.json({ error: 'Failed to create blocked dates' }, { status: 500 })
            }

            return NextResponse.json({ success: true, count: dates.length }, { status: 201 })
        } else {
            // Single date
            const validationResult = createBlockedDateSchema.safeParse(body)

            if (!validationResult.success) {
                return NextResponse.json({
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors
                }, { status: 400 })
            }

            const { staff_id, blocked_date, reason } = validationResult.data

            // Проверяем staff_id если указан
            if (staff_id) {
                const { data: staff } = await supabase
                    .from('staff')
                    .select('id')
                    .eq('id', staff_id)
                    .eq('tenant_id', userData.tenant_id)
                    .single()

                if (!staff) {
                    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
                }
            }

            const { data: blockedDate, error } = await supabase
                .from('blocked_dates')
                .upsert({
                    tenant_id: userData.tenant_id,
                    staff_id: staff_id || null,
                    blocked_date,
                    reason: reason || null,
                }, { onConflict: 'tenant_id,staff_id,blocked_date' })
                .select()
                .single()

            if (error) {
                console.error('Blocked date creation error:', error)
                return NextResponse.json({ error: 'Failed to create blocked date' }, { status: 500 })
            }

            return NextResponse.json({ blocked_date: blockedDate }, { status: 201 })
        }
    } catch (error) {
        console.error('Blocked dates POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}