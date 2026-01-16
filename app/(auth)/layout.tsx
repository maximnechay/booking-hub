// app/(auth)/layout.tsx
// Редирект залогиненных пользователей с /login и /register

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Если уже залогинен — редирект в dashboard
    if (user) {
        redirect('/dashboard')
    }

    return <>{children}</>
}