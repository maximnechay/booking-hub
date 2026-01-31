// app/api/public/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

const DAY_NAMES = [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
    'Freitag', 'Samstag', 'Sonntag'
]

// GET /api/public/[slug] — публичные данные салона
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        // 1. Получаем tenant
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('id, name, slug, description, address, phone, email, website, logo_url, cover_image_url')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        // 2. Working hours
        const { data: workingHoursRaw } = await supabaseAdmin
            .from('working_hours')
            .select('day_of_week, open_time, close_time, is_open')
            .eq('tenant_id', tenant.id)
            .order('day_of_week', { ascending: true })

        const working_hours = (workingHoursRaw || []).map(wh => ({
            day: wh.day_of_week,
            day_name: DAY_NAMES[wh.day_of_week] || `Tag ${wh.day_of_week}`,
            is_open: wh.is_open ?? false,
            ...(wh.is_open ? { open: wh.open_time, close: wh.close_time } : {}),
        }))

        // 3. Categories + Services
        const { data: categoriesRaw } = await supabaseAdmin
            .from('service_categories')
            .select('id, name')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        const { data: servicesRaw } = await supabaseAdmin
            .from('services')
            .select('id, name, description, duration, price, category_id')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .eq('online_booking_enabled', true)
            .order('sort_order', { ascending: true })

        const services = servicesRaw || []

        const categories = (categoriesRaw || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            services: services
                .filter(s => s.category_id === cat.id)
                .map(({ category_id, ...s }) => s),
        })).filter(cat => cat.services.length > 0)

        const uncategorized_services = services
            .filter(s => !s.category_id)
            .map(({ category_id, ...s }) => s)

        // 4. Staff
        const { data: staffRaw } = await supabaseAdmin
            .from('staff')
            .select('id, name, avatar_url, bio, title')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        const staff = (staffRaw || []).map(s => ({
            id: s.id,
            name: s.name,
            avatar_url: s.avatar_url,
            bio: s.bio,
            title: s.title,
        }))

        // Убираем id из tenant response
        const { id, ...tenantPublic } = tenant

        return NextResponse.json({
            tenant: tenantPublic,
            working_hours,
            categories,
            uncategorized_services,
            staff,
        })
    } catch (error) {
        console.error('Public salon page error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
