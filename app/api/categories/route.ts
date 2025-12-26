// app/api/categories/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCategorySchema } from '@/lib/validations/categories'

// GET /api/categories
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

        // Получаем все категории
        const { data: categories, error } = await supabase
            .from('service_categories')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Categories fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
        }

        // Строим дерево
        const rootCategories = categories?.filter(c => !c.parent_id) || []
        const tree = rootCategories.map(root => ({
            ...root,
            children: categories?.filter(c => c.parent_id === root.id) || []
        }))

        return NextResponse.json({ categories: tree })
    } catch (error) {
        console.error('Categories GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/categories
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
        const validationResult = createCategorySchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const validatedData = validationResult.data

        // Проверяем parent_id если указан
        if (validatedData.parent_id) {
            const { data: parent } = await supabase
                .from('service_categories')
                .select('id')
                .eq('id', validatedData.parent_id)
                .eq('tenant_id', userData.tenant_id)
                .single()

            if (!parent) {
                return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
            }
        }

        const { data: category, error } = await supabase
            .from('service_categories')
            .insert({
                tenant_id: userData.tenant_id,
                ...validatedData,
            })
            .select()
            .single()

        if (error) {
            console.error('Category creation error:', error)
            return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
        }

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error('Categories POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}