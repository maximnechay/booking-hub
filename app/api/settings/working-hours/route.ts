// app/api/settings/working-hours/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateWorkingHoursSchema } from '@/lib/validations/working-hours'

// GET /api/settings/working-hours
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

        const { data: workingHours, error } = await supabase
            .from('working_hours')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .order('day_of_week', { ascending: true })

        if (error) {
            console.error('Working hours fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch working hours' }, { status: 500 })
        }

        return NextResponse.json({ working_hours: workingHours })
    } catch (error) {
        console.error('Working hours GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/settings/working-hours
export async function PUT(request: NextRequest) {
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
        const validationResult = updateWorkingHoursSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten()
            }, { status: 400 })
        }

        const workingHours = validationResult.data.map(day => ({
            tenant_id: userData.tenant_id,
            ...day,
        }))

        const { error } = await supabase
            .from('working_hours')
            .upsert(workingHours, { onConflict: 'tenant_id,day_of_week' })

        if (error) {
            console.error('Working hours update error:', error)
            return NextResponse.json({ error: 'Failed to update working hours' }, { status: 500 })
        }

        const { data: updatedHours } = await supabase
            .from('working_hours')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .order('day_of_week', { ascending: true })

        return NextResponse.json({ working_hours: updatedHours })
    } catch (error) {
        console.error('Working hours PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
