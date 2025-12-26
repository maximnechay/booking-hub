// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { user_id, salon_name, salon_slug, name, email, phone } = body

        // Валидация
        if (!user_id || !salon_name || !salon_slug || !name || !email) {
            return NextResponse.json(
                { error: 'Alle Pflichtfelder müssen ausgefüllt sein' },
                { status: 400 }
            )
        }

        // 1. Проверяем что slug свободен
        const { data: existingTenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('slug', salon_slug)
            .single()

        if (existingTenant) {
            return NextResponse.json(
                { error: 'Diese URL ist bereits vergeben' },
                { status: 400 }
            )
        }

        // 2. Создаём tenant
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({
                name: salon_name,
                slug: salon_slug,
                email: email,
                phone: phone || null,
                timezone: 'Europe/Berlin',
                settings: {},
                is_active: true,
            })
            .select()
            .single()

        if (tenantError) {
            console.error('Tenant creation error:', tenantError)
            return NextResponse.json(
                { error: 'Fehler beim Erstellen des Salons' },
                { status: 500 }
            )
        }

        // 3. Создаём user profile
        const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                id: user_id,
                tenant_id: tenant.id,
                email: email,
                name: name,
                role: 'owner',
                is_active: true,
            })

        if (userError) {
            console.error('User creation error:', userError)
            // Откатываем tenant
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json(
                { error: 'Fehler beim Erstellen des Benutzers' },
                { status: 500 }
            )
        }

        // 4. Создаём дефолтные рабочие часы (Пн-Пт 9-18)
        const workingHours = []
        for (let day = 0; day < 7; day++) {
            workingHours.push({
                tenant_id: tenant.id,
                day_of_week: day,
                open_time: '09:00',
                close_time: '18:00',
                is_open: day < 5, // Пн-Пт открыто, Сб-Вс закрыто
            })
        }

        await supabaseAdmin.from('working_hours').insert(workingHours)

        // 5. Успех
        return NextResponse.json({
            success: true,
            tenant_id: tenant.id,
            tenant_slug: tenant.slug,
        })

    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        )
    }
}