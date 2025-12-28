// app/api/cron/cleanup-pending/route.ts
// Vercel Cron Job — запускается каждые 5 минут
// Отменяет pending брони у которых истёк expires_at

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        // Проверка authorization header (Vercel Cron secret)
        const authHeader = request.headers.get('authorization')

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('[CRON] Unauthorized attempt')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[CRON] Starting cleanup_expired_pending...')

        // Вызываем функцию cleanup
        const { data, error } = await supabaseAdmin.rpc('cleanup_expired_pending')

        if (error) {
            console.error('[CRON] Cleanup error:', error)
            throw error
        }

        // Функция возвращает массив с одним элементом { cancelled_count: N }
        const result = data && data.length > 0 ? data[0] : { cancelled_count: 0 }
        const cancelledCount = result.cancelled_count || 0

        console.log(`[CRON] Cleanup completed. Cancelled ${cancelledCount} bookings.`)

        return NextResponse.json({
            success: true,
            cancelled: cancelledCount,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('[CRON] Cleanup failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// Также поддерживаем POST (для тестирования вручную)
export async function POST(request: NextRequest) {
    return GET(request)
}