// app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCategorySchema } from '@/lib/validations/categories'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/categories/[id]
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

        const { data: category, error } = await supabase
            .from('service_categories')
            .select('*, services(*)')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (error || !category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        return NextResponse.json({ category })
    } catch (error) {
        console.error('Category GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/categories/[id]
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

        const { data: existing } = await supabase
            .from('service_categories')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        const body = await request.json()
        const validationResult = updateCategorySchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { data: category, error } = await supabase
            .from('service_categories')
            .update(validationResult.data)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Category update error:', error)
            return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
        }

        return NextResponse.json({ category })
    } catch (error) {
        console.error('Category PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/categories/[id]
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

        const { data: existing } = await supabase
            .from('service_categories')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        // Удаляем категорию (услуги останутся с category_id = NULL)
        const { error } = await supabase
            .from('service_categories')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Category delete error:', error)
            return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Category DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}