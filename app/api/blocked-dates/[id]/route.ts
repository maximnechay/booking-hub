// app/api/blocked-dates/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

// DELETE /api/blocked-dates/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        // Проверяем что запись принадлежит tenant
        const { data: existing } = await supabase
            .from('blocked_dates')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Blocked date not found' }, { status: 404 })
        }

        const { error } = await supabase
            .from('blocked_dates')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Blocked date delete error:', error)
            return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Blocked date DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}