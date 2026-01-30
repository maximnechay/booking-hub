// app/dashboard/bookings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Eye, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteBookingButton } from './delete-booking-button'

const PAGE_SIZE = 25

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
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
        .select('tenant_id, role, tenant:tenants(timezone)')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) redirect('/login')

    const timezone = userData.tenant?.timezone || 'Europe/Berlin'
    const canDelete = userData.role === 'owner' || userData.role === 'admin'

    const statusParam = getParam('status') || 'all'
    const fromParam = getParam('from')
    const toParam = getParam('to')
    const upcomingOnly = getParam('upcoming') === '1'
    const staffParam = getParam('staff')
    const categoryParam = getParam('category')
    const page = Math.max(1, parseInt(getParam('page') || '1', 10) || 1)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

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
        `, { count: 'exact' })
        .eq('tenant_id', userData.tenant_id)
        .neq('client_name', 'RESERVED') // Скрываем незавершённые резервации

    if (statusParam !== 'all' && validStatuses.includes(statusParam as BookingStatus)) {
        query = query.eq('status', statusParam as BookingStatus)
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

    // Für zukünftige Termine: aufsteigend (nächste zuerst)
    // Sonst: absteigend (neueste zuerst)
    const { data: bookings, count } = await query
        .order('start_time', { ascending: upcomingOnly })
        .range(from, to)

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    // Построение URL с сохранением текущих фильтров
    function buildPageUrl(p: number) {
        const params = new URLSearchParams()
        if (statusParam !== 'all') params.set('status', statusParam)
        if (staffParam) params.set('staff', staffParam)
        if (categoryParam) params.set('category', categoryParam)
        if (fromParam) params.set('from', fromParam)
        if (toParam) params.set('to', toParam)
        if (upcomingOnly) params.set('upcoming', '1')
        if (p > 1) params.set('page', String(p))
        const qs = params.toString()
        return `/dashboard/bookings${qs ? `?${qs}` : ''}`
    }

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
                <Link href="/dashboard/bookings/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Neuer Termin
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-6">
                <form method="get" className="space-y-3 md:space-y-0 md:flex md:flex-row md:items-end md:gap-4">
                    <div className="grid grid-cols-2 gap-2 md:contents">
                        <div className="space-y-1 md:flex-1 md:min-w-[160px]">
                            <label className="text-xs text-gray-500">Status</label>
                            <select
                                name="status"
                                defaultValue={statusParam}
                                className="h-9 md:h-10 w-full rounded-md border border-input bg-background px-2 md:px-3 py-1 text-sm"
                            >
                                <option value="all">Alle</option>
                                <option value="pending">Ausstehend</option>
                                <option value="confirmed">Bestätigt</option>
                                <option value="completed">Abgeschlossen</option>
                                <option value="cancelled">Storniert</option>
                                <option value="no_show">Nicht erschienen</option>
                            </select>
                        </div>

                        {staff && staff.length > 0 && (
                            <div className="space-y-1 md:flex-1 md:min-w-[160px]">
                                <label className="text-xs text-gray-500">Mitarbeiter</label>
                                <select
                                    name="staff"
                                    defaultValue={staffParam}
                                    className="h-9 md:h-10 w-full rounded-md border border-input bg-background px-2 md:px-3 py-1 text-sm"
                                >
                                    <option value="">Alle</option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {categories && categories.length > 0 && (
                            <div className="space-y-1 md:flex-1 md:min-w-[160px]">
                                <label className="text-xs text-gray-500">Kategorie</label>
                                <select
                                    name="category"
                                    defaultValue={categoryParam}
                                    className="h-9 md:h-10 w-full rounded-md border border-input bg-background px-2 md:px-3 py-1 text-sm"
                                >
                                    <option value="">Alle</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1 md:flex-1 md:min-w-[140px]">
                            <label className="text-xs text-gray-500">Von</label>
                            <input
                                type="date"
                                name="from"
                                defaultValue={fromParam}
                                className="h-9 md:h-10 w-full rounded-md border border-input bg-background px-2 md:px-3 py-1 text-sm"
                            />
                        </div>

                        <div className="space-y-1 md:flex-1 md:min-w-[140px]">
                            <label className="text-xs text-gray-500">Bis</label>
                            <input
                                type="date"
                                name="to"
                                defaultValue={toParam}
                                className="h-9 md:h-10 w-full rounded-md border border-input bg-background px-2 md:px-3 py-1 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                name="upcoming"
                                id="upcoming"
                                value="1"
                                defaultChecked={upcomingOnly}
                                className="h-4 w-4"
                            />
                            Nur zukünftige
                        </label>

                        <Button type="submit" variant="outline" size="sm" className="md:size-default">
                            Filtern
                        </Button>
                    </div>
                </form>
            </div>

            {/* Table */}
            {bookings && bookings.length > 0 ? (
                <>
                    <p className="text-sm text-gray-500 mb-4">
                        {totalCount} Termine gefunden
                        {totalPages > 1 && ` — Seite ${page} von ${totalPages}`}
                    </p>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
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
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktion</th>
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
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/dashboard/bookings/${booking.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Details
                                                        </Button>
                                                    </Link>
                                                    {canDelete && <DeleteBookingButton bookingId={booking.id} />}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <Link
                                href={buildPageUrl(page - 1)}
                                className={`inline-flex items-center gap-1 text-sm font-medium ${page <= 1 ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:text-gray-900'}`}
                                aria-disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Zurück
                            </Link>
                            <span className="text-sm text-gray-500">
                                Seite {page} von {totalPages}
                            </span>
                            <Link
                                href={buildPageUrl(page + 1)}
                                className={`inline-flex items-center gap-1 text-sm font-medium ${page >= totalPages ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:text-gray-900'}`}
                                aria-disabled={page >= totalPages}
                            >
                                Weiter
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500">Noch keine Termine vorhanden</p>
                </div>
            )}
        </div>
    )
}