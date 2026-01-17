// app/dashboard/services/[id]/edit/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Category {
    id: string
    name: string
    children?: Category[]
}

interface Service {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    buffer_after: number
    min_advance_hours: number | null
    max_advance_days: number | null
    is_active: boolean
    online_booking_enabled: boolean
    category_id: string | null
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 30,
        price: '',
        buffer_after: 0,
        min_advance_hours: '',
        max_advance_days: '',
        is_active: true,
        online_booking_enabled: true,
        category_id: '',
    })

    // Загрузка данных
    useEffect(() => {
        async function loadData() {
            try {
                // Загружаем услугу
                const serviceRes = await fetch(`/api/services/${id}`)
                const serviceData = await serviceRes.json()

                if (!serviceRes.ok) {
                    setError('Service nicht gefunden')
                    return
                }

                const service: Service = serviceData.service
                setFormData({
                    name: service.name,
                    description: service.description || '',
                    duration: service.duration,
                    price: (service.price / 100).toFixed(2),
                    buffer_after: service.buffer_after || 0,
                    min_advance_hours: service.min_advance_hours?.toString() || '',
                    max_advance_days: service.max_advance_days?.toString() || '',
                    is_active: service.is_active,
                    online_booking_enabled: service.online_booking_enabled,
                    category_id: service.category_id || '',
                })

                // Загружаем категории
                const categoriesRes = await fetch('/api/categories')
                const categoriesData = await categoriesRes.json()
                if (categoriesData.categories) {
                    setCategories(categoriesData.categories)
                }
            } catch (err) {
                setError('Fehler beim Laden')
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setFieldErrors({})

        // Конвертация цены в центы
        const priceInCents = Math.round(parseFloat(formData.price.replace(',', '.')) * 100)

        if (isNaN(priceInCents)) {
            setError('Bitte geben Sie einen gültigen Preis ein')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    duration: formData.duration,
                    price: priceInCents,
                    buffer_after: formData.buffer_after,
                    min_advance_hours: formData.min_advance_hours ? parseInt(formData.min_advance_hours) : null,
                    max_advance_days: formData.max_advance_days ? parseInt(formData.max_advance_days) : null,
                    is_active: formData.is_active,
                    online_booking_enabled: formData.online_booking_enabled,
                    category_id: formData.category_id || null,
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

            router.push('/dashboard/services')
            router.refresh()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    // Рекурсивный рендер категорий для select
    const renderCategoryOptions = (cats: Category[], level = 0): React.ReactElement[] => {
        const result: React.ReactElement[] = []

        for (const cat of cats) {
            const prefix = '\u00A0\u00A0'.repeat(level)
            result.push(
                <option key={cat.id} value={cat.id}>
                    {prefix}{cat.name}
                </option>
            )
            if (cat.children && cat.children.length > 0) {
                result.push(...renderCategoryOptions(cat.children, level + 1))
            }
        }

        return result
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
                    href="/dashboard/services"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Dienstleistung bearbeiten</h1>
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
                            placeholder="z.B. Haarschnitt"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={isLoading}
                            required
                        />
                        {fieldErrors.name && (
                            <p className="text-sm text-red-600">{fieldErrors.name[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <textarea
                            id="description"
                            placeholder="Optionale Beschreibung..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={isLoading}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategorie</Label>
                        <select
                            id="category"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            disabled={isLoading}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Keine Kategorie</option>
                            {renderCategoryOptions(categories)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Dauer (Minuten) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="5"
                                max="480"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
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
                                type="text"
                                placeholder="25,00"
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

                    <div className="space-y-2">
                        <Label htmlFor="buffer_after">Puffer nach Termin (Minuten)</Label>
                        <Input
                            id="buffer_after"
                            type="number"
                            min="0"
                            max="60"
                            value={formData.buffer_after}
                            onChange={(e) => setFormData({ ...formData, buffer_after: parseInt(e.target.value) || 0 })}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">Zeit zwischen Terminen (z.B. für Reinigung)</p>
                    </div>

                    {/* Buchungsregeln */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Buchungsregeln</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_advance_hours">Mindestvorlauf (Stunden)</Label>
                                <Input
                                    id="min_advance_hours"
                                    type="number"
                                    min="0"
                                    max="168"
                                    placeholder="0"
                                    value={formData.min_advance_hours}
                                    onChange={(e) => setFormData({ ...formData, min_advance_hours: e.target.value })}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">Wie viele Stunden im Voraus muss gebucht werden?</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_advance_days">Maximale Vorausbuchung (Tage)</Label>
                                <Input
                                    id="max_advance_days"
                                    type="number"
                                    min="1"
                                    max="365"
                                    placeholder="90"
                                    value={formData.max_advance_days}
                                    onChange={(e) => setFormData({ ...formData, max_advance_days: e.target.value })}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">Wie viele Tage im Voraus kann gebucht werden?</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
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
                                Service ist aktiv
                            </Label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="online_booking_enabled"
                                checked={formData.online_booking_enabled}
                                onChange={(e) => setFormData({ ...formData, online_booking_enabled: e.target.checked })}
                                disabled={isLoading}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="online_booking_enabled" className="font-normal">
                                Online-Buchung aktiviert
                            </Label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                        </Button>
                        <Link href="/dashboard/services">
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