// app/dashboard/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Users, Scissors } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) {
        redirect('/login')
    }

    const tenantId = userData.tenant_id

    // Статистика
    const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    const stats = [
        { name: 'Termine heute', value: bookingsCount || 0, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
        { name: 'Dienstleistungen', value: servicesCount || 0, icon: Scissors, color: 'bg-purple-100 text-purple-600' },
        { name: 'Mitarbeiter', value: staffCount || 0, icon: Users, color: 'bg-green-100 text-green-600' },
    ]

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Übersicht</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Start */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellstart</h2>
                <div className="space-y-3">
                    <a
                        href="/dashboard/services"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${(servicesCount || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {(servicesCount || 0) > 0 ? '✓' : '○'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Dienstleistungen hinzufügen</p>
                                <p className="text-sm text-gray-500">Fügen Sie Ihre Services hinzu</p>
                            </div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>

                    <a
                        href="/dashboard/staff"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${(staffCount || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {(staffCount || 0) > 0 ? '✓' : '○'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Mitarbeiter hinzufügen</p>
                                <p className="text-sm text-gray-500">Fügen Sie Ihr Team hinzu</p>
                            </div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>

                    <a
                        href="/dashboard/integration"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                                ○
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Widget einbetten</p>
                                <p className="text-sm text-gray-500">Integrieren Sie das Buchungswidget</p>
                            </div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </a>
                </div>
            </div>
        </div>
    )
}