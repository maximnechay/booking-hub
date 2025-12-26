// lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

if (typeof window !== 'undefined') {
    throw new Error(
        '🚨 SECURITY: supabaseAdmin cannot be imported on the client!'
    )
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('🚨 Missing SUPABASE_SERVICE_ROLE_KEY env variable')
}

export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)