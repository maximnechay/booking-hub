// proxy.ts (бывший middleware.ts)
// Next.js 16: proxy занимается ТОЛЬКО роутингом и cookie refresh
// Auth проверки — в layout.tsx

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Supabase cookie refresh — это НЕ auth check, это поддержание сессии
    // Это должно остаться в proxy для корректной работы SSR
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Вызываем getUser() чтобы обновить токены если нужно
    // Но НЕ используем результат для редиректов — это делает layout
    await supabase.auth.getUser()

    return supabaseResponse
}

export const config = {
    matcher: [
        // Исключаем статику, API и виджет
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|widget).*)',
    ],
}