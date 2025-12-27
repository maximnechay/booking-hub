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
        .select('tenant_id, tenant:tenants(timezone)')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) {
        redirect('/login')
    }

    const tenantId = userData.tenant_id
    const timezone = userData.tenant?.timezone || 'Europe/Berlin'

    const getDateParts = (date: Date) => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(date)
        const partMap = new Map(parts.map(part => [part.type, part.value]))
        return {
            year: Number(partMap.get('year')),
            month: Number(partMap.get('month')),
            day: Number(partMap.get('day')),
        }
    }

    const getOffsetString = (date: Date) => {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'shortOffset',
        }).formatToParts(date)
        const tz = parts.find(part => part.type === 'timeZoneName')?.value || 'GMT+0'
        const match = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
        if (!match) return '+00:00'
        const sign = match[1]
        const hours = match[2].padStart(2, '0')
        const minutes = (match[3] || '00').padStart(2, '0')
        return `${sign}${hours}:${minutes}`
    }

    const buildRange = (start: Date, days: number) => {
        const startParts = getDateParts(start)
        const startUtc = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day))
        const endUtc = new Date(startUtc.getTime() + days * 86400000)
        const endParts = getDateParts(endUtc)
        const offsetStart = getOffsetString(startUtc)
        const offsetEnd = getOffsetString(endUtc)
        const startIso = `${startParts.year}-${String(startParts.month).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}T00:00:00${offsetStart}`
        const endIso = `${endParts.year}-${String(endParts.month).padStart(2, '0')}-${String(endParts.day).padStart(2, '0')}T00:00:00${offsetEnd}`
        return { startIso, endIso }
    }

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

    const { startIso: todayStart, endIso: todayEnd } = buildRange(new Date(), 1)
    const { startIso: weekStart, endIso: weekEnd } = buildRange(new Date(), 7)

    const { count: todayCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('start_time', todayStart)
        .lt('start_time', todayEnd)

    const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', weekStart)
        .lt('start_time', weekEnd)

    const stats = [
        { name: 'Termine heute', value: todayCount || 0, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
        { name: 'Termine 7 Tage', value: upcomingCount || 0, icon: Calendar, color: 'bg-indigo-100 text-indigo-600' },
        { name: 'Gesamt Termine', value: bookingsCount || 0, icon: Calendar, color: 'bg-amber-100 text-amber-600' },
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
