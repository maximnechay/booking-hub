// app/dashboard/bookings/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Service {
    id: string
    name: string
    duration: number
    price: number
    is_active: boolean
}

interface Staff {
    id: string
    name: string
}

interface Variant {
    id: string
    name: string
    duration: number
    price: number
}

export default function NewBookingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [services, setServices] = useState<Service[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [variants, setVariants] = useState<Variant[]>([])
    const [slots, setSlots] = useState<string[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [slotsReason, setSlotsReason] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        service_id: '',
        staff_id: '',
        variant_id: '',
        date: '',
        time: '',
        duration: 30,
        price: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        notes: '',
    })

    useEffect(() => {
        async function loadData() {
            try {
                const [servicesRes, staffRes] = await Promise.all([
                    fetch('/api/services'),
                    fetch('/api/staff'),
                ])
                const servicesData = await servicesRes.json()
                const staffData = await staffRes.json()
                if (servicesData.services) {
                    setServices(servicesData.services.filter((s: Service) => s.is_active))
                }
                if (staffData.staff) {
                    setStaffList(staffData.staff)
                }
            } catch (err) {
                console.error('Failed to load data:', err)
            }
        }
        loadData()
    }, [])

    // Загрузка слотов при изменении услуги/мастера/даты
    useEffect(() => {
        if (!formData.service_id || !formData.staff_id || !formData.date) {
            setSlots([])
            setSlotsReason(null)
            return
        }

        async function loadSlots() {
            setSlotsLoading(true)
            setSlotsReason(null)
            setFormData(prev => ({ ...prev, time: '' }))
            try {
                const params = new URLSearchParams({
                    service_id: formData.service_id,
                    staff_id: formData.staff_id,
                    date: formData.date,
                })
                const res = await fetch(`/api/bookings/slots?${params}`)
                const data = await res.json()
                setSlots(data.slots || [])
                if (data.reason) {
                    setSlotsReason(data.reason)
                }
            } catch {
                setSlots([])
            } finally {
                setSlotsLoading(false)
            }
        }
        loadSlots()
    }, [formData.service_id, formData.staff_id, formData.date])

    async function handleServiceChange(serviceId: string) {
        setFormData(prev => ({ ...prev, service_id: serviceId, variant_id: '', time: '' }))
        setVariants([])

        const service = services.find(s => s.id === serviceId)
        if (service) {
            setFormData(prev => ({
                ...prev,
                service_id: serviceId,
                variant_id: '',
                time: '',
                duration: service.duration,
                price: (service.price / 100).toFixed(2),
            }))

            try {
                const res = await fetch(`/api/services/${serviceId}/variants`)
                const data = await res.json()
                if (data.variants && data.variants.length > 0) {
                    setVariants(data.variants)
                }
            } catch {
                // ignore
            }
        }
    }

    function handleVariantChange(variantId: string) {
        setFormData(prev => ({ ...prev, variant_id: variantId }))
        const variant = variants.find(v => v.id === variantId)
        if (variant) {
            setFormData(prev => ({
                ...prev,
                variant_id: variantId,
                duration: variant.duration,
                price: (variant.price / 100).toFixed(2),
            }))
        } else if (variantId === '') {
            const service = services.find(s => s.id === formData.service_id)
            if (service) {
                setFormData(prev => ({
                    ...prev,
                    variant_id: '',
                    duration: service.duration,
                    price: (service.price / 100).toFixed(2),
                }))
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setFieldErrors({})

        try {
            const priceInCents = Math.round(parseFloat(formData.price || '0') * 100)

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: formData.service_id,
                    staff_id: formData.staff_id,
                    variant_id: formData.variant_id || null,
                    date: formData.date,
                    time: formData.time,
                    duration: formData.duration,
                    price: priceInCents,
                    client_name: formData.client_name,
                    client_phone: formData.client_phone,
                    client_email: formData.client_email || null,
                    notes: formData.notes || null,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                if (result.details) {
                    setFieldErrors(result.details)
                }
                setError(result.error || 'Fehler beim Erstellen des Termins')
                return
            }

            router.push('/dashboard/bookings')
            router.refresh()
        } catch {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const canShowSlots = formData.service_id && formData.staff_id && formData.date

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/bookings"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Neuer Termin</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Service & Staff */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service_id">Dienstleistung *</Label>
                            <select
                                id="service_id"
                                value={formData.service_id}
                                onChange={(e) => handleServiceChange(e.target.value)}
                                disabled={isLoading}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Bitte wählen —</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {fieldErrors.service_id && (
                                <p className="text-sm text-red-600">{fieldErrors.service_id[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="staff_id">Mitarbeiter *</Label>
                            <select
                                id="staff_id"
                                value={formData.staff_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value, time: '' }))}
                                disabled={isLoading}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Bitte wählen —</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {fieldErrors.staff_id && (
                                <p className="text-sm text-red-600">{fieldErrors.staff_id[0]}</p>
                            )}
                        </div>
                    </div>

                    {/* Variant */}
                    {variants.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="variant_id">Variante</Label>
                            <select
                                id="variant_id"
                                value={formData.variant_id}
                                onChange={(e) => handleVariantChange(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Keine Variante —</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Datum *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, time: '' }))}
                            disabled={isLoading}
                            required
                            className="max-w-[200px]"
                        />
                        {fieldErrors.date && (
                            <p className="text-sm text-red-600">{fieldErrors.date[0]}</p>
                        )}
                    </div>

                    {/* Time Slots */}
                    {canShowSlots && (
                        <div className="space-y-2">
                            <Label>Uhrzeit *</Label>
                            {slotsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verfügbare Zeiten werden geladen...
                                </div>
                            ) : slotsReason ? (
                                <p className="text-sm text-amber-600 py-2">{slotsReason}</p>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-gray-500 py-2">Keine verfügbaren Zeiten an diesem Tag</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {slots.map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                                            disabled={isLoading}
                                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                                formData.time === slot
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {fieldErrors.time && (
                                <p className="text-sm text-red-600">{fieldErrors.time[0]}</p>
                            )}
                        </div>
                    )}

                    {/* Duration & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Dauer (Minuten) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="5"
                                max="480"
                                step="5"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                disabled={isLoading}
                                required
                            />
                            {fieldErrors.duration && (
                                <p className="text-sm text-red-600">{fieldErrors.duration[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Preis (€) *</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                disabled={isLoading}
                                required
                            />
                            {fieldErrors.price && (
                                <p className="text-sm text-red-600">{fieldErrors.price[0]}</p>
                            )}
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Kundendaten</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client_name">Name *</Label>
                                    <Input
                                        id="client_name"
                                        placeholder="Vor- und Nachname"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        disabled={isLoading}
                                        required
                                    />
                                    {fieldErrors.client_name && (
                                        <p className="text-sm text-red-600">{fieldErrors.client_name[0]}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client_phone">Telefon *</Label>
                                    <Input
                                        id="client_phone"
                                        type="tel"
                                        placeholder="+49 123 456789"
                                        value={formData.client_phone}
                                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                        disabled={isLoading}
                                        required
                                    />
                                    {fieldErrors.client_phone && (
                                        <p className="text-sm text-red-600">{fieldErrors.client_phone[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client_email">E-Mail</Label>
                                <Input
                                    id="client_email"
                                    type="email"
                                    placeholder="kunde@beispiel.de"
                                    value={formData.client_email}
                                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                    disabled={isLoading}
                                />
                                {fieldErrors.client_email && (
                                    <p className="text-sm text-red-600">{fieldErrors.client_email[0]}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Anmerkungen</Label>
                        <textarea
                            id="notes"
                            placeholder="Optionale Anmerkungen zum Termin"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                        {fieldErrors.notes && (
                            <p className="text-sm text-red-600">{fieldErrors.notes[0]}</p>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isLoading || !formData.time}>
                            {isLoading ? 'Wird erstellt...' : 'Termin erstellen'}
                        </Button>
                        <Link href="/dashboard/bookings">
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
