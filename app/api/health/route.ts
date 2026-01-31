// app/api/health/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redis } from '@/lib/security/rate-limit'

interface HealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    version: string
    checks: {
        database: ServiceCheck
        redis: ServiceCheck
    }
    responseTime: number
}

interface ServiceCheck {
    status: 'up' | 'down'
    latency?: number
    error?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    const startTime = Date.now()

    const checks: HealthCheck['checks'] = {
        database: { status: 'down' },
        redis: { status: 'down' },
    }

    // Check Database
    try {
        const dbStart = Date.now()
        const { error } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .limit(1)

        if (error) throw error

        checks.database = {
            status: 'up',
            latency: Date.now() - dbStart,
        }
    } catch (error) {
        checks.database = {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }

    // Check Redis
    try {
        const redisStart = Date.now()

        if (redis) {
            await redis.ping()
            checks.redis = {
                status: 'up',
                latency: Date.now() - redisStart,
            }
        } else {
            checks.redis = {
                status: 'down',
                error: 'Redis not configured',
            }
        }
    } catch (error) {
        checks.redis = {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }

    // Determine overall status
    const allUp = Object.values(checks).every(c => c.status === 'up')
    const allDown = Object.values(checks).every(c => c.status === 'down')

    let status: HealthCheck['status'] = 'healthy'
    if (allDown) {
        status = 'unhealthy'
    } else if (!allUp) {
        status = 'degraded'
    }

    const health: HealthCheck = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks,
        responseTime: Date.now() - startTime,
    }

    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(health, {
        status: httpStatus,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    })
}
