// app/dashboard/staff/[id]/edit/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ImageUpload from '@/components/ui/image-upload'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Service {
    id: string
    name: string
}

interface Staff {
    id: string
    name: string
    email: string | null
    phone: string | null
    avatar_url: string | null
    is_active: boolean
    services: { service: { id: string; name: string } }[]
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [services, setServices] = useState<Service[]>([])
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
        is_active: true,
        service_ids: [] as string[],
    })

    // Загрузка данных
    useEffect(() => {
        async function loadData() {
            try {
                // Загружаем мастера
                const staffRes = await fetch(`/api/staff/${id}`)
                const staffData = await staffRes.json()

                if (!staffRes.ok) {
                    setError('Mitarbeiter nicht gefunden')
                    return
                }

                const staff: Staff = staffData.staff
                setFormData({
                    name: staff.name,
                    email: staff.email || '',
                    phone: staff.phone || '',
                    avatar_url: staff.avatar_url || '',
                    is_active: staff.is_active,
                    service_ids: staff.services?.map(s => s.service.id) || [],
                })

                // Загружаем услуги
                const servicesRes = await fetch('/api/services')
                const servicesData = await servicesRes.json()
                if (servicesData.services) {
                    setServices(servicesData.services)
                }
            } catch (err) {
                setError('Fehler beim Laden')
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }, [id])

    const handleServiceToggle = (serviceId: string) => {
        setFormData(prev => ({
            ...prev,
            service_ids: prev.service_ids.includes(serviceId)
                ? prev.service_ids.filter(id => id !== serviceId)
                : [...prev.service_ids, serviceId]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setFieldErrors({})

        try {
            const response = await fetch(`/api/staff/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    avatar_url: formData.avatar_url || null,
                    is_active: formData.is_active,
                    service_ids: formData.service_ids,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                if (result.details) {
                    setFieldErrors(result.details)
                }
                setError(result.error || 'Fehler beim Speichern')
                return
            }

            router.push('/dashboard/staff')
            router.refresh()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/staff"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter bearbeiten</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="z.B. Maria Müller"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={isLoading}
                            required
                        />
                        {fieldErrors.name && (
                            <p className="text-sm text-red-600">{fieldErrors.name[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-Mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="maria@beispiel.de"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isLoading}
                            />
                            {fieldErrors.email && (
                                <p className="text-sm text-red-600">{fieldErrors.email[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+49 123 456 7890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={isLoading}
                            />
                            {fieldErrors.phone && (
                                <p className="text-sm text-red-600">{fieldErrors.phone[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ImageUpload
                            currentUrl={formData.avatar_url || null}
                            onUploaded={(url) => setFormData({ ...formData, avatar_url: url ?? '' })}
                            uploadType="avatar"
                            uploadEndpoint="/api/staff/upload"
                            extraUploadData={{ staff_id: id }}
                            extraDeleteData={{ staff_id: id }}
                            label="Foto"
                            aspect="square"
                        />
                        {fieldErrors.avatar_url && (
                            <p className="text-sm text-red-600">{fieldErrors.avatar_url[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Dienstleistungen</Label>
                        <p className="text-xs text-gray-500 mb-2">
                            Welche Services kann dieser Mitarbeiter durchführen?
                        </p>
                        {services.length > 0 ? (
                            <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                                {services.map((service) => (
                                    <label key={service.id} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.service_ids.includes(service.id)}
                                            onChange={() => handleServiceToggle(service.id)}
                                            disabled={isLoading}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm">{service.name}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 p-4 border rounded-md">
                                Keine Services vorhanden.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="is_active" className="font-normal">
                            Mitarbeiter ist aktiv
                        </Label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                        </Button>
                        <Link href="/dashboard/staff">
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
