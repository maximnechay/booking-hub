// lib/security/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Разные лимитеры для разных endpoints
export const rateLimiters = {
    // Widget: резервирование слота — строго
    widgetReserve: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
        prefix: 'rl:widget:reserve',
    }),

    // Widget: завершение букинга — ещё строже
    widgetComplete: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 req/min
        prefix: 'rl:widget:complete',
    }),

    // Widget: получение слотов — мягче (частые запросы при выборе даты)
    widgetSlots: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
        prefix: 'rl:widget:slots',
    }),

    // Widget: чтение данных (services, staff) — ещё мягче
    widgetRead: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, '1 m'), // 120 req/min
        prefix: 'rl:widget:read',
    }),
}

// Получение IP из request
export function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    return '127.0.0.1'
}

// Генерация ключа: IP + tenant slug
export function getRateLimitKey(request: NextRequest, slug?: string): string {
    const ip = getClientIP(request)
    return slug ? `${ip}:${slug}` : ip
}

// Проверка rate limit
export async function checkRateLimit(
    limiter: Ratelimit,
    key: string
): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
}> {
    try {
        const result = await limiter.limit(key)
        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
        }
    } catch (error) {
        // Fail open: если Redis недоступен — пропускаем
        console.error('Rate limit check failed:', error)
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: 0,
        }
    }
}

// Response для превышения лимита
export function rateLimitResponse(result: {
    limit: number
    remaining: number
    reset: number
}): NextResponse {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return NextResponse.json(
        {
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
            retryAfter,
        },
        {
            status: 429,
            headers: {
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.reset.toString(),
                'Retry-After': retryAfter.toString(),
            },
        }
    )
}