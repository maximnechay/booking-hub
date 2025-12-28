// app/dashboard/bookings/[id]/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Scissors,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText
} from 'lucide-react'

interface Booking {
    id: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
    start_time: string
    end_time: string
    client_name: string
    client_phone: string
    client_email: string | null
    notes: string | null
    price_at_booking: number
    duration_at_booking: number
    source: string | null
    created_at: string
    service: { id: string; name: string; duration: number; price: number } | null
    staff: { id: string; name: string; phone: string | null; email: string | null } | null
    variant: { id: string; name: string; duration: number; price: number } | null
}

const statusConfig = {
    pending: {
        label: 'Ausstehend',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: AlertCircle
    },
    confirmed: {
        label: 'Bestätigt',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
    },
    cancelled: {
        label: 'Storniert',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle
    },
    completed: {
        label: 'Abgeschlossen',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle
    },
    no_show: {
        label: 'Nicht erschienen',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
    },
}

// Разрешённые переходы статусов
const allowedTransitions: Record<string, { status: string; label: string; variant: 'default' | 'destructive' | 'outline' }[]> = {
    pending: [
        { status: 'confirmed', label: 'Bestätigen', variant: 'default' },
        { status: 'cancelled', label: 'Stornieren', variant: 'destructive' },
    ],
    confirmed: [
        { status: 'completed', label: 'Abschließen', variant: 'default' },
        { status: 'no_show', label: 'Nicht erschienen', variant: 'outline' },
        { status: 'cancelled', label: 'Stornieren', variant: 'destructive' },
    ],
    cancelled: [],
    completed: [],
    no_show: [],
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadBooking()
    }, [id])

    async function loadBooking() {
        try {
            const res = await fetch(`/api/bookings/${id}`)
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Buchung nicht gefunden')
                } else {
                    setError('Fehler beim Laden')
                }
                return
            }
            const data = await res.json()
            setBooking(data.booking)
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!booking) return

        const confirmMessages: Record<string, string> = {
            confirmed: 'Buchung bestätigen?',
            cancelled: 'Buchung wirklich stornieren?',
            completed: 'Buchung als abgeschlossen markieren?',
            no_show: 'Kunde als nicht erschienen markieren?',
        }

        if (!confirm(confirmMessages[newStatus] || 'Status ändern?')) {
            return
        }

        setIsUpdating(true)
        setError(null)

        try {
            const res = await fetch(`/api/bookings/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.message || 'Fehler beim Aktualisieren')
                return
            }

            const data = await res.json()
            setBooking(prev => prev ? { ...prev, status: data.booking.status } : null)
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsUpdating(false)
        }
    }

    const formatDateTime = (value: string) => {
        return new Date(value).toLocaleString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatTime = (value: string) => {
        return new Date(value).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        })
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Lädt...</p>
            </div>
        )
    }

    if (error && !booking) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <Link href="/dashboard/bookings">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Zurück zur Liste
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (!booking) return null

    const StatusIcon = statusConfig[booking.status].icon
    const transitions = allowedTransitions[booking.status] || []

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/bookings"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück zur Liste
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Buchung von {booking.client_name}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Erstellt am {new Date(booking.created_at).toLocaleDateString('de-DE')}
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig[booking.status].color}`}>
                        <StatusIcon className="h-4 w-4" />
                        {statusConfig[booking.status].label}
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Main Info */}
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {/* Termin */}
                <div className="p-6">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                        Termin
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {formatDateTime(booking.start_time)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    bis {formatTime(booking.end_time)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {formatDuration(booking.duration_at_booking)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {formatPrice(booking.price_at_booking)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service & Staff */}
                <div className="p-6">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                        Dienstleistung
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Scissors className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking.service?.name || 'Unbekannt'}
                                </p>
                                {booking.variant && (
                                    <p className="text-sm text-gray-500">
                                        Variante: {booking.variant.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking.staff?.name || 'Unbekannt'}
                                </p>
                                <p className="text-sm text-gray-500">Mitarbeiter</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client */}
                <div className="p-6">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                        Kunde
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{booking.client_name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <a
                                    href={`tel:${booking.client_phone}`}
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    {booking.client_phone}
                                </a>
                            </div>
                        </div>
                        {booking.client_email && (
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <a
                                        href={`mailto:${booking.client_email}`}
                                        className="font-medium text-blue-600 hover:underline"
                                    >
                                        {booking.client_email}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                    <div className="p-6">
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Anmerkungen
                        </h2>
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <p className="text-gray-700">{booking.notes}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {transitions.length > 0 && (
                    <div className="p-6 bg-gray-50">
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Aktionen
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {transitions.map((action) => (
                                <Button
                                    key={action.status}
                                    variant={action.variant}
                                    onClick={() => handleStatusChange(action.status)}
                                    disabled={isUpdating}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Meta Info */}
            <div className="mt-6 text-sm text-gray-500">
                <p>Quelle: {booking.source || 'widget'}</p>
                <p>ID: {booking.id}</p>
            </div>
        </div>
    )
}