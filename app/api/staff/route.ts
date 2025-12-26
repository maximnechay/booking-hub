// app/api/staff/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStaffSchema } from '@/lib/validations/staff'

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

        const body = await request.json()
        const validationResult = createStaffSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { service_ids, ...staffData } = validationResult.data

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