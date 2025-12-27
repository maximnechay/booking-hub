// app/dashboard/services/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ServicesList from './services-list'

export default async function ServicesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) redirect('/login')

    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('sort_order', { ascending: true })

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dienstleistungen</h1>
                <Link href="/dashboard/services/new">
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Dienstleistung
                    </Button>
                </Link>
            </div>
            <ServicesList services={services ?? []} />
        </div>
    )
}
