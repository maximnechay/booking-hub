// app/api/settings/tenant/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTenantSchema } from '@/lib/validations/tenant'

// GET /api/settings/tenant
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

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, name, slug, email, phone, address, logo_url')
            .eq('id', userData.tenant_id)
            .single()

        if (error || !tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Tenant GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/settings/tenant
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
        const validationResult = updateTenantSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten(),
            }, { status: 400 })
        }

        const { error, data: tenant } = await supabase
            .from('tenants')
            .update(validationResult.data)
            .eq('id', userData.tenant_id)
            .select('id, name, slug, email, phone, address, logo_url')
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Update not permitted' }, { status: 403 })
            }
            console.error('Tenant update error:', error)
            return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
        }

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Tenant PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
