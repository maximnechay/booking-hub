// app/api/widget/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET /api/widget/[slug] — публичная информация о салоне
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        const { data: tenant, error } = await supabaseAdmin
            .from('tenants')
            .select('id, name, slug, logo_url, phone, address, settings')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (error || !tenant) {
            return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
        }

        return NextResponse.json({ tenant })
    } catch (error) {
        console.error('Widget info error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}