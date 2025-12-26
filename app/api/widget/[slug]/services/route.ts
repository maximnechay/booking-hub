// app/api/widget/[slug]/services/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET /api/widget/[slug]/services — публичный список услуг с категориями и вариантами
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

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

        // Получаем категории
        const { data: categories } = await supabaseAdmin
            .from('service_categories')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        // Получаем активные услуги с онлайн-бронированием И с вариантами
        const { data: services, error } = await supabaseAdmin
            .from('services')
            .select(`
        id, name, description, duration, price, category_id,
        variants:service_variants(id, name, description, duration, price, sort_order, is_active)
      `)
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .eq('online_booking_enabled', true)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Services fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
        }

        // Фильтруем неактивные варианты и сортируем
        const servicesWithVariants = services?.map(service => ({
            ...service,
            variants: (service.variants as { is_active: boolean; sort_order: number }[])
                ?.filter((v) => v.is_active)
                ?.sort((a, b) => a.sort_order - b.sort_order) || []
        })) || []

        // Строим структуру категорий
        const rootCategories = categories?.filter(c => !c.parent_id) || []
        const subCategories = categories?.filter(c => c.parent_id) || []

        const categoriesTree = rootCategories.map(root => ({
            ...root,
            children: subCategories
                .filter(sub => sub.parent_id === root.id)
                .map(sub => ({
                    ...sub,
                    services: servicesWithVariants.filter(s => s.category_id === sub.id)
                })),
            services: servicesWithVariants.filter(s => s.category_id === root.id)
        }))

        // Услуги без категории
        const uncategorizedServices = servicesWithVariants.filter(s => !s.category_id)

        return NextResponse.json({
            categories: categoriesTree,
            uncategorized: uncategorizedServices,
            services: servicesWithVariants
        })
    } catch (error) {
        console.error('Widget services error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}