// app/dashboard/bookings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestatigt',
    cancelled: 'Storniert',
    completed: 'Abgeschlossen',
    no_show: 'Nicht erschienen',
}

const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(cents / 100)
}

const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
}

type SearchParamsValue = string | string[] | undefined
type SearchParams = Record<string, SearchParamsValue> | Promise<Record<string, SearchParamsValue>>

export default async function BookingsPage({ searchParams }: { searchParams: SearchParams }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const resolvedParams = await Promise.resolve(searchParams)
    const getParam = (key: string) => {
        const value = resolvedParams?.[key]
        return Array.isArray(value) ? value[0] : value || ''
    }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, tenant:tenants(timezone)')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) redirect('/login')

    const timezone = userData.tenant?.timezone || 'Europe/Berlin'

    const statusParam = getParam('status') || 'all'
    const fromParam = getParam('from')
    const toParam = getParam('to')
    const upcomingOnly = getParam('upcoming') === '1'
    const staffParam = getParam('staff')
    const categoryParam = getParam('category')

    const { data: staff } = await supabase
        .from('staff')
        .select('id, name')
        .eq('tenant_id', userData.tenant_id)
        .order('name', { ascending: true })

    const { data: categories } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('tenant_id', userData.tenant_id)
        .order('name', { ascending: true })

    let query = supabase
        .from('bookings')
        .select(`
            id,
            client_name,
            client_phone,
            client_email,
            start_time,
            end_time,
            status,
            price_at_booking,
            duration_at_booking,
            staff:staff(id, name),
            service:services!inner(id, name, category_id, category:service_categories(id, name))
        `)
        .eq('tenant_id', userData.tenant_id)

    if (statusParam !== 'all') {
        query = query.eq('status', statusParam)
    }

    if (staffParam) {
        query = query.eq('staff_id', staffParam)
    }

    if (categoryParam) {
        query = query.eq('service.category_id', categoryParam)
    }

    if (fromParam) {
        const fromDate = new Date(`${fromParam}T00:00:00`)
        if (!Number.isNaN(fromDate.getTime())) {
            query = query.gte('start_time', fromDate.toISOString())
        }
    }

    if (toParam) {
        const toDate = new Date(`${toParam}T23:59:59`)
        if (!Number.isNaN(toDate.getTime())) {
            query = query.lte('start_time', toDate.toISOString())
        }
    }

    if (upcomingOnly) {
        query = query.gte('start_time', new Date().toISOString())
    }

    const { data: bookings } = await query.order('start_time', { ascending: true })

    const formatDateTime = (value: string) => {
        return new Date(value).toLocaleString('de-DE', {
            timeZone: timezone,
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Termine</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <form method="get" className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 min-w-[160px] space-y-1">
                        <label className="text-xs text-gray-500">Status</label>
                        <select
                            name="status"
                            defaultValue={statusParam}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">Alle</option>
                            <option value="pending">Ausstehend</option>
                            <option value="confirmed">Bestatigt</option>
                            <option value="completed">Abgeschlossen</option>
                            <option value="cancelled">Storniert</option>
                            <option value="no_show">Nicht erschienen</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-1">
                        <label className="text-xs text-gray-500">Mitarbeiter</label>
                        <select
                            name="staff"
                            defaultValue={staffParam}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Alle</option>
                            {staff?.map((member) => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-1">
                        <label className="text-xs text-gray-500">Kategorie</label>
                        <select
                            name="category"
                            defaultValue={categoryParam}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Alle</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-1">
                        <label className="text-xs text-gray-500">Von</label>
                        <input
                            type="date"
                            name="from"
                            defaultValue={fromParam}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-1">
                        <label className="text-xs text-gray-500">Bis</label>
                        <input
                            type="date"
                            name="to"
                            defaultValue={toParam}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            name="upcoming"
                            value="1"
                            defaultChecked={upcomingOnly}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Nur zukunftige
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="h-10 rounded-md bg-gray-900 text-white px-4 text-sm"
                        >
                            Anwenden
                        </button>
                        <a
                            href="/dashboard/bookings"
                            className="h-10 rounded-md border border-gray-200 px-4 text-sm flex items-center text-gray-700"
                        >
                            Reset
                        </a>
                    </div>
                </form>
            </div>

            {bookings && bookings.length > 0 ? (
                <>
                    <div className="space-y-4 md:hidden">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{booking.client_name}</p>
                                        <p className="text-sm text-gray-500">{formatDateTime(booking.start_time)}</p>
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {statusLabels[booking.status] || booking.status}
                                    </span>
                                </div>
                                <div className="mt-3 text-sm text-gray-600 space-y-1">
                                    <p>{booking.service?.name || '-'}</p>
                                    <p>{booking.staff?.name || '-'}</p>
                                    <p>{formatDuration(booking.duration_at_booking)} · {formatPrice(booking.price_at_booking)}</p>
                                </div>
                                <div className="mt-3 text-sm text-gray-500 space-y-1">
                                    {booking.client_phone && <p>{booking.client_phone}</p>}
                                    {booking.client_email && <p>{booking.client_email}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitarbeiter</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dauer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatDateTime(booking.start_time)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{booking.client_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {booking.client_phone || booking.client_email || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {booking.service?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {booking.staff?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDuration(booking.duration_at_booking)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatPrice(booking.price_at_booking)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {statusLabels[booking.status] || booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500">Noch keine Termine vorhanden</p>
                </div>
            )}
        </div>
    )
}
