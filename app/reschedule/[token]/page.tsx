// app/reschedule/[token]/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { de } from 'date-fns/locale'
import { addDays, format } from 'date-fns'
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Turnstile } from '@/components/ui/turnstile'

interface BookingInfo {
    id: string
    status: string
    start_time: string
    end_time: string
    client_name: string
    service: {
        id: string
        name: string
        duration: number
        min_advance_hours: number
        max_advance_days: number
    } | null
    staff: { id: string; name: string } | null
    variant: { id: string; name: string; duration: number } | null
    tenant: { name: string; slug: string } | null
}

interface RescheduleResult {
    id: string
    start_time: string
    end_time: string
}

type PageState =
    | 'loading'
    | 'invalid'
    | 'already_done'
    | 'too_late'
    | 'wrong_status'
    | 'select_datetime'
    | 'submitting'
    | 'success'
    | 'error'

export default function RescheduleBookingPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [pageState, setPageState] = useState<PageState>('loading')
    const [booking, setBooking] = useState<BookingInfo | null>(null)
    const [result, setResult] = useState<RescheduleResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Date/time selection
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [slots, setSlots] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Turnstile
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

    useEffect(() => {
        loadBooking()
    }, [token])

    async function loadBooking() {
        try {
            const res = await fetch(`/api/reschedule/${token}`)
            const data = await res.json()

            if (!res.ok) {
                setPageState('invalid')
                return
            }

            setBooking(data.booking)

            if (!data.canReschedule) {
                switch (data.reason) {
                    case 'already_rescheduled':
                        setPageState('already_done')
                        break
                    case 'too_late':
                        setPageState('too_late')
                        break
                    case 'wrong_status':
                        setPageState('wrong_status')
                        break
                    case 'past':
                        setPageState('too_late')
                        break
                    default:
                        setPageState('invalid')
                }
                return
            }

            setPageState('select_datetime')
        } catch {
            setPageState('invalid')
        }
    }

    // Загрузка слотов при выборе даты
    useEffect(() => {
        if (!selectedDate) return

        setLoadingSlots(true)
        setSlots([])
        setSelectedTime(null)

        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        fetch(`/api/reschedule/${token}/slots?date=${dateStr}`)
            .then(res => res.json())
            .then(data => {
                setSlots(data.slots || [])
            })
            .catch(() => {
                setSlots([])
            })
            .finally(() => {
                setLoadingSlots(false)
            })
    }, [selectedDate, token])

    async function handleReschedule() {
        if (!selectedDate || !selectedTime || !turnstileToken) return

        setPageState('submitting')
        setError(null)

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')

            const res = await fetch(`/api/reschedule/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    time: selectedTime,
                    turnstile_token: turnstileToken,
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.message || 'Verschieben fehlgeschlagen.')
                setPageState('select_datetime')
                setTurnstileToken(null)
                return
            }

            setResult(data.booking)
            setPageState('success')
        } catch {
            setError('Ein Fehler ist aufgetreten.')
            setPageState('select_datetime')
            setTurnstileToken(null)
        }
    }

    const formatDateTime = (value: string) => {
        return new Date(value).toLocaleString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
    }

    const formatTime = (value: string) => {
        return new Date(value).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Min.`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
    }

    // Loading state
    if (pageState === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Lädt...</p>
            </div>
        )
    }

    // Invalid token
    if (pageState === 'invalid') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h1>
                    <p className="text-gray-600">Buchung nicht gefunden oder Link ungültig.</p>
                </div>
            </div>
        )
    }

    // Already rescheduled
    if (pageState === 'already_done') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Bereits verschoben</h1>
                    <p className="text-gray-600">Dieser Termin wurde bereits verschoben. Ein Termin kann nur einmal verschoben werden.</p>
                </div>
            </div>
        )
    }

    // Too late
    if (pageState === 'too_late') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Verschieben nicht möglich</h1>
                    <p className="text-gray-600">
                        Das Verschieben ist für diesen Termin nicht mehr möglich.
                        Bitte kontaktieren Sie den Salon direkt.
                    </p>
                </div>
            </div>
        )
    }

    // Wrong status
    if (pageState === 'wrong_status') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Verschieben nicht möglich</h1>
                    <p className="text-gray-600">Dieser Termin kann nicht verschoben werden.</p>
                </div>
            </div>
        )
    }

    // Success state
    if (pageState === 'success' && result) {
        const duration = booking?.variant?.duration || booking?.service?.duration || 0

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
                    <div className="text-center mb-6">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h1 className="text-xl font-semibold text-gray-900">Termin erfolgreich verschoben!</h1>
                    </div>

                    <div className="bg-green-50 rounded-lg p-5 mb-6 space-y-4 border-l-4 border-green-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Neuer Termin</p>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Scissors className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {booking?.variant ? `${booking.service?.name} - ${booking.variant.name}` : booking?.service?.name}
                                </p>
                                <p className="text-sm text-gray-500">bei {booking?.staff?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Calendar className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {formatDateTime(result.start_time)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Clock className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {formatTime(result.start_time)} Uhr
                                    {duration > 0 && ` · ${formatDuration(duration)}`}
                                </p>
                            </div>
                        </div>

                        {booking?.tenant && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                    <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{booking.tenant.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                        Sie erhalten eine Bestätigung per E-Mail.
                    </p>
                </div>
            </div>
        )
    }

    if (!booking) return null

    const today = new Date()
    const maxAdvanceDays = booking.service?.max_advance_days ?? 90
    const duration = booking.variant?.duration || booking.service?.duration || 0
    const serviceName = booking.variant
        ? `${booking.service?.name} - ${booking.variant.name}`
        : booking.service?.name

    // Select datetime state
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <RefreshCw className="h-6 w-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Termin verschieben</h1>
                    </div>

                    {/* Current booking info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aktueller Termin</p>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Scissors className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{serviceName}</p>
                                <p className="text-xs text-gray-500">bei {booking.staff?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="font-medium text-gray-900 text-sm">
                                {formatDateTime(booking.start_time)}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                                <Clock className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="font-medium text-gray-900 text-sm">
                                {formatTime(booking.start_time)} Uhr
                                {duration > 0 && ` · ${formatDuration(duration)}`}
                            </p>
                        </div>
                    </div>

                    {/* Date picker */}
                    <div className="bg-white border rounded-lg p-2 sm:p-4 mb-6 overflow-x-auto">
                        <style>{`
                            .reschedule-calendar .rdp {
                                --rdp-cell-size: 40px;
                                --rdp-accent-color: #2563eb;
                                --rdp-background-color: #eff6ff;
                                margin: 0 auto;
                            }
                            @media (max-width: 400px) {
                                .reschedule-calendar .rdp {
                                    --rdp-cell-size: 36px;
                                }
                            }
                            @media (max-width: 340px) {
                                .reschedule-calendar .rdp {
                                    --rdp-cell-size: 32px;
                                }
                            }
                            .reschedule-calendar .rdp-day_disabled {
                                color: #d1d5db !important;
                                background-color: #f3f4f6 !important;
                            }
                            .reschedule-calendar .rdp-day_selected {
                                background-color: #2563eb !important;
                                color: white !important;
                            }
                            .reschedule-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                                background-color: #dbeafe;
                            }
                        `}</style>
                        <div className="reschedule-calendar min-w-[280px]">
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => setSelectedDate(date || undefined)}
                                locale={de}
                                disabled={[
                                    { before: addDays(today, 1) },
                                    { after: addDays(today, maxAdvanceDays) },
                                ]}
                                footer={
                                    <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-3 rounded bg-blue-600"></span>
                                            Ausgewählt
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-3 rounded bg-gray-200"></span>
                                            Nicht verfügbar
                                        </span>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    {/* Time slots */}
                    {selectedDate && (
                        <div className="bg-white border rounded-lg p-4 mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Verfügbare Zeiten am {format(selectedDate, "d. MMMM", { locale: de })}
                            </p>

                            {loadingSlots ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    Keine Termine an diesem Tag verfügbar
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`px-3 py-2 text-sm border rounded-lg transition-all ${
                                                selectedTime === time
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                                    : 'hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Turnstile + Submit */}
                    {selectedTime && (
                        <div className="space-y-4">
                            <Turnstile
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken(null)}
                                onError={() => setTurnstileToken(null)}
                            />

                            {error && (
                                <p className="text-red-600 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleReschedule}
                                disabled={!turnstileToken || pageState === 'submitting'}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                            >
                                {pageState === 'submitting'
                                    ? 'Wird verschoben...'
                                    : `Termin verschieben auf ${selectedTime} Uhr`
                                }
                            </button>

                            <p className="text-xs text-amber-600 text-center">
                                Hinweis: Ein Termin kann nur einmal verschoben werden.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
