// app/api/cron/cleanup-holds/route.ts

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

        console.log('[CRON] Starting holds cleanup...')

        // Удаляем просроченные holds
        const { data, error } = await supabaseAdmin
            .from('slot_holds')
            .delete()
            .lt('expires_at', new Date().toISOString())
            .select('id')

        if (error) {
            console.error('[CRON] Cleanup error:', error)
            throw error
        }

        const deletedCount = data?.length || 0

        console.log(`[CRON] Cleanup completed. Deleted ${deletedCount} expired holds.`)

        return NextResponse.json({
            success: true,
            deleted: deletedCount,
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

export async function POST(request: NextRequest) {
    return GET(request)
}