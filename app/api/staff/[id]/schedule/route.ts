// app/api/staff/[id]/schedule/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStaffScheduleSchema } from '@/lib/validations/schedule'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/staff/[id]/schedule
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        // Проверяем что мастер принадлежит tenant
        const { data: staff } = await supabase
            .from('staff')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        const { data: schedule, error } = await supabase
            .from('staff_schedule')
            .select('*')
            .eq('staff_id', id)
            .order('day_of_week', { ascending: true })

        if (error) {
            console.error('Schedule fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
        }

        return NextResponse.json({ schedule })
    } catch (error) {
        console.error('Schedule GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/staff/[id]/schedule — обновить всё расписание
// PUT /api/staff/[id]/schedule — обновить всё расписание
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        // Проверяем что мастер принадлежит tenant
        const { data: staff } = await supabase
            .from('staff')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        const body = await request.json()

        // DEBUG
        console.log('=== SCHEDULE DEBUG ===')
        console.log('Body received:', JSON.stringify(body, null, 2))

        const validationResult = updateStaffScheduleSchema.safeParse(body)

        if (!validationResult.success) {
            // DEBUG
            console.log('Validation FAILED:')
            console.log('Errors:', JSON.stringify(validationResult.error.flatten(), null, 2))

            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten()
            }, { status: 400 })
        }

        // DEBUG
        console.log('Validation PASSED')
        console.log('Parsed data:', JSON.stringify(validationResult.data, null, 2))

        const scheduleData = validationResult.data



        // Удаляем старое расписание
        await supabase
            .from('staff_schedule')
            .delete()
            .eq('staff_id', id)

        // Вставляем новое
        const scheduleRows = scheduleData.map(day => ({
            tenant_id: userData.tenant_id,
            staff_id: id,
            ...day,
        }))

        const { error } = await supabase
            .from('staff_schedule')
            .insert(scheduleRows)

        if (error) {
            console.error('Schedule update error:', error)
            return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
        }

        // Возвращаем обновлённое расписание
        const { data: schedule } = await supabase
            .from('staff_schedule')
            .select('*')
            .eq('staff_id', id)
            .order('day_of_week', { ascending: true })

        return NextResponse.json({ schedule })
    } catch (error) {
        console.error('Schedule PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}