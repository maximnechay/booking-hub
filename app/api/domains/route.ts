// app/api/domains/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const domainSchema = z.object({
    domain: z.string()
        .min(3, 'Domain zu kurz')
        .max(255, 'Domain zu lang')
        .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/, 'Ungültiges Domain-Format')
})

// GET /api/domains
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

        const { data: domains, error } = await supabase
            .from('tenant_allowed_domains')
            .select('*')
            .eq('tenant_id', userData.tenant_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Domains fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
        }

        return NextResponse.json({ domains })
    } catch (error) {
        console.error('Domains GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/domains
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
        const validationResult = domainSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { domain } = validationResult.data

        // Нормализуем domain (убираем www, https, trailing slash)
        const normalized = domain
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')

        // Проверяем дубликаты
        const { data: existing } = await supabase
            .from('tenant_allowed_domains')
            .select('id')
            .eq('tenant_id', userData.tenant_id)
            .eq('domain', normalized)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Domain bereits vorhanden' }, { status: 400 })
        }

        const { data: newDomain, error } = await supabase
            .from('tenant_allowed_domains')
            .insert({
                tenant_id: userData.tenant_id,
                domain: normalized,
            })
            .select()
            .single()

        if (error) {
            console.error('Domain creation error:', error)
            return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 })
        }

        return NextResponse.json({ domain: newDomain }, { status: 201 })
    } catch (error) {
        console.error('Domains POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}