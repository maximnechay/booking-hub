// app/api/widget/[slug]/staff/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET /api/widget/[slug]/staff?service_id=xxx — мастера для услуги
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('service_id')

        // Получаем tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        // Базовый запрос
        let query = supabaseAdmin
            .from('staff')
            .select('id, name, avatar_url')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        // Если указана услуга — фильтруем по staff_services
        if (serviceId) {
            const { data: staffServices } = await supabaseAdmin
                .from('staff_services')
                .select('staff_id')
                .eq('service_id', serviceId)

            if (staffServices && staffServices.length > 0) {
                const staffIds = staffServices.map(ss => ss.staff_id)
                query = query.in('id', staffIds)
            } else {
                // Нет мастеров для этой услуги
                return NextResponse.json({ staff: [] })
            }
        }

        const { data: staff, error } = await query

        if (error) {
            console.error('Staff fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
        }

        return NextResponse.json({ staff })
    } catch (error) {
        console.error('Widget staff error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}