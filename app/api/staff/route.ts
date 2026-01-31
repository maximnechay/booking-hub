// app/api/staff/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStaffSchema } from '@/lib/validations/staff'
import { PlanService } from '@/lib/services/plan-service'

interface WorkingHourRow {
    day_of_week: number
    open_time: string
    close_time: string
    is_open: boolean
}

const buildDefaultScheduleRows = (tenantId: string, staffId: string) =>
    Array.from({ length: 7 }, (_, dayIndex) => ({
        tenant_id: tenantId,
        staff_id: staffId,
        day_of_week: dayIndex,
        start_time: '09:00',
        end_time: '20:00',
        break_start: null,
        break_end: null,
        is_working: dayIndex < 5,
    }))

const buildScheduleRows = (
    tenantId: string,
    staffId: string,
    workingHours: WorkingHourRow[] | null
) => {
    if (!workingHours || workingHours.length === 0) {
        return buildDefaultScheduleRows(tenantId, staffId)
    }

    return workingHours.map(day => ({
        tenant_id: tenantId,
        staff_id: staffId,
        day_of_week: day.day_of_week,
        start_time: day.open_time,
        end_time: day.close_time,
        break_start: null,
        break_end: null,
        is_working: day.is_open,
    }))
}

// GET /api/staff
export async function GET() {
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

        const { data: staff, error } = await supabase
            .from('staff')
            .select(`
        *,
        services:staff_services(
          service:services(id, name)
        )
      `)
            .eq('tenant_id', userData.tenant_id)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Staff fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
        }

        return NextResponse.json({ staff })
    } catch (error) {
        console.error('Staff GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/staff
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

        // Проверка лимита staff
        const staffLimit = await PlanService.checkStaffLimit(userData.tenant_id)
        if (!staffLimit.allowed) {
            return NextResponse.json({
                error: 'STAFF_LIMIT_REACHED',
                message: staffLimit.message,
                upgrade_url: '/dashboard/plan'
            }, { status: 403 })
        }

        const body = await request.json()
        const validationResult = createStaffSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { service_ids, ...staffData } = validationResult.data

        const { data: workingHours, error: workingHoursError } = await supabase
            .from('working_hours')
            .select('day_of_week, open_time, close_time, is_open')
            .eq('tenant_id', userData.tenant_id)
            .order('day_of_week', { ascending: true })

        if (workingHoursError) {
            console.error('Working hours fetch error:', workingHoursError)
            return NextResponse.json({ error: 'Failed to load tenant working hours' }, { status: 500 })
        }

        // Создаём мастера
        const { data: staff, error } = await supabase
            .from('staff')
            .insert({
                tenant_id: userData.tenant_id,
                ...staffData,
            })
            .select()
            .single()

        if (error) {
            console.error('Staff creation error:', error)
            return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
        }

        const defaultScheduleRows = buildScheduleRows(
            userData.tenant_id,
            staff.id,
            (workingHours as WorkingHourRow[]) ?? null
        )
        const { error: scheduleError } = await supabase
            .from('staff_schedule')
            .insert(defaultScheduleRows)

        if (scheduleError) {
            console.error('Staff schedule creation error:', scheduleError)
            await supabase
                .from('staff')
                .delete()
                .eq('id', staff.id)
            return NextResponse.json({ error: 'Failed to create staff schedule' }, { status: 500 })
        }

        // Привязываем услуги
        if (service_ids && service_ids.length > 0) {
            const staffServices = service_ids.map(service_id => ({
                staff_id: staff.id,
                service_id,
                tenant_id: userData.tenant_id,
            }))

            const { error: linkError } = await supabase
                .from('staff_services')
                .insert(staffServices)

            if (linkError) {
                console.error('Staff services link error:', linkError)
            }
        }

        return NextResponse.json({ staff }, { status: 201 })
    } catch (error) {
        console.error('Staff POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
