// app/dashboard/staff/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StaffList from './staff-list'

export default async function StaffPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) redirect('/login')

    const { data: staff } = await supabase
        .from('staff')
        .select(`
      *,
      services:staff_services(
        service:services(id, name)
      )
    `)
        .eq('tenant_id', userData.tenant_id)
        .order('sort_order', { ascending: true })

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter</h1>
                <Link href="/dashboard/staff/new">
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Neuer Mitarbeiter
                    </Button>
                </Link>
            </div>

            <StaffList staff={staff || []} />
        </div>
    )
}
