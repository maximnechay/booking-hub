// app/cancel/[token]/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface BookingInfo {
    id: string
    status: string
    start_time: string
    end_time: string
    client_name: string
    service_name: string
    staff_name: string
    salon_name: string
}

export default function CancelBookingPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [booking, setBooking] = useState<BookingInfo | null>(null)
    const [canCancel, setCanCancel] = useState(false)
    const [reason, setReason] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancelled, setCancelled] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadBooking()
    }, [token])

    async function loadBooking() {
        try {
            const res = await fetch(`/api/cancel/${token}`)
            const data = await res.json()

            if (!res.ok) {
                setError(data.error === 'Booking not found'
                    ? 'Buchung nicht gefunden oder Link ungültig.'
                    : 'Ein Fehler ist aufgetreten.')
                return
            }

            setBooking(data.booking)
            setCanCancel(data.canCancel)
            setReason(data.reason)
        } catch (err) {
            setError('Ein Fehler ist aufgetreten.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCancel() {
        if (!confirm('Möchten Sie diesen Termin wirklich stornieren?')) {
            return
        }

        setIsCancelling(true)
        setError(null)

        try {
            const res = await fetch(`/api/cancel/${token}`, {
                method: 'POST',
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.message || 'Stornierung fehlgeschlagen.')
                return
            }

            setCancelled(true)
        } catch (err) {
            setError('Ein Fehler ist aufgetreten.')
        } finally {
            setIsCancelling(false)
        }
    }

    const formatDateTime = (value: string) => {
        return new Date(value).toLocaleString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Lädt...</p>
            </div>
        )
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    if (cancelled) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Termin storniert</h1>
                    <p className="text-gray-600">
                        Ihr Termin wurde erfolgreich storniert.
                    </p>
                </div>
            </div>
        )
    }

    if (!booking) return null

    const statusAlreadyCancelled = booking.status === 'cancelled'

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Termin stornieren
                </h1>

                {/* Booking Info */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {formatDateTime(booking.start_time)}
                            </p>
                            <p className="text-sm text-gray-500">
                                bis {formatTime(booking.end_time)} Uhr
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                            <Scissors className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{booking.service_name}</p>
                            <p className="text-sm text-gray-500">bei {booking.staff_name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                            <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{booking.client_name}</p>
                            <p className="text-sm text-gray-500">{booking.salon_name}</p>
                        </div>
                    </div>
                </div>

                {/* Status / Actions */}
                {statusAlreadyCancelled ? (
                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                        <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Dieser Termin wurde bereits storniert.</p>
                    </div>
                ) : reason === 'past' ? (
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-amber-700">Vergangene Termine können nicht storniert werden.</p>
                    </div>
                ) : canCancel ? (
                    <div className="space-y-4">
                        {error && (
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        )}
                        <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                        >
                            {isCancelling ? 'Wird storniert...' : 'Termin stornieren'}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                            Diese Aktion kann nicht rückgängig gemacht werden.
                        </p>
                    </div>
                ) : (
                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                        <p className="text-gray-600">Dieser Termin kann nicht mehr storniert werden.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
