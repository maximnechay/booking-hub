// app/api/bookings/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteParams {
    params: Promise<{ id: string }>
}

const updateStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
})

// PATCH /api/bookings/[id]/status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Проверяем авторизацию
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Получаем tenant и роль пользователя
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Валидация body
        const body = await request.json()
        const validationResult = updateStatusSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validationResult.error.flatten().fieldErrors
            }, { status: 400 })
        }

        const { status: newStatus } = validationResult.data

        // Проверяем что букинг принадлежит tenant
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, status, staff_id')
            .eq('id', id)
            .eq('tenant_id', userData.tenant_id)
            .single()

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Проверка прав для staff — могут менять только свои записи
        if (userData.role === 'staff') {
            // Получаем staff_id для этого user
            const { data: staffData } = await supabase
                .from('staff')
                .select('id')
                .eq('user_id', user.id)
                .eq('tenant_id', userData.tenant_id)
                .single()

            if (!staffData || booking.staff_id !== staffData.id) {
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
            }
        }

        // Валидация переходов статусов
        const allowedTransitions: Record<string, string[]> = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['completed', 'cancelled', 'no_show'],
            cancelled: [], // Нельзя менять отменённые
            completed: [], // Нельзя менять завершённые
            no_show: [], // Нельзя менять no_show
        }

        const currentStatus = booking.status
        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
            return NextResponse.json({
                error: 'INVALID_TRANSITION',
                message: `Статус "${currentStatus}" нельзя изменить на "${newStatus}"`,
                allowed: allowedTransitions[currentStatus] || []
            }, { status: 400 })
        }

        // Обновляем статус
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                // Если подтверждаем — убираем expires_at
                ...(newStatus === 'confirmed' ? { expires_at: null } : {})
            })
            .eq('id', id)
            .select('id, status, start_time, end_time, client_name')
            .single()

        if (updateError) {
            console.error('Status update error:', updateError)
            return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
        }

        return NextResponse.json({
            booking: updatedBooking,
            message: `Status geändert zu "${newStatus}"`
        })

    } catch (error) {
        console.error('Booking status PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}