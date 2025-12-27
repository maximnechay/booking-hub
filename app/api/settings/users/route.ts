// app/api/settings/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateUserRoleSchema = z.object({
    id: z.string().uuid(),
    role: z.enum(['owner', 'admin', 'staff']),
})

// GET /api/settings/users
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

        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('tenant_id', userData.tenant_id)
            .order('name', { ascending: true })

        if (error) {
            console.error('Users fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }

        return NextResponse.json({ users })
    } catch (error) {
        console.error('Users GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/settings/users
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
        const validationResult = updateUserRoleSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten(),
            }, { status: 400 })
        }

        const { id, role } = validationResult.data

        const { data: targetUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (targetUser.role === 'owner' && targetUser.id !== user.id) {
            return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 })
        }

        if (userData.role !== 'owner' && role === 'owner') {
            return NextResponse.json({ error: 'Cannot assign owner role' }, { status: 403 })
        }

        if (user.id === id && role !== userData.role) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 })
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', id)
            .select('id, name, email, role')
            .single()

        if (error) {
            console.error('User role update error:', error)
            return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
        }

        return NextResponse.json({ user: updatedUser })
    } catch (error) {
        console.error('Users PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
