// app/dashboard/services/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

interface Category {
    id: string
    name: string
    children?: Category[]
}

export default function NewServicePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 30,
        price: '',
        buffer_after: 0,
        is_active: true,
        online_booking_enabled: true,
        category_id: '',
    })

    // Загрузка категорий
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch('/api/categories')
                const data = await res.json()
                if (data.categories) {
                    setCategories(data.categories)
                }
            } catch (err) {
                console.error('Failed to load categories:', err)
            }
        }
        loadCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setFieldErrors({})

        try {
            // Конвертируем цену в центы
            const priceInCents = Math.round(parseFloat(formData.price || '0') * 100)

            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    duration: formData.duration,
                    price: priceInCents,
                    buffer_after: formData.buffer_after,
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
                setError(result.error || 'Fehler beim Erstellen der Dienstleistung')
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
                <h1 className="text-2xl font-bold text-gray-900">Neue Dienstleistung</h1>
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
                            placeholder="z.B. Haarschnitt Damen"
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
                        <Label htmlFor="category_id">Kategorie</Label>
                        <select
                            id="category_id"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">— Keine Kategorie —</option>
                            {categories.map(cat => (
                                <optgroup key={cat.id} label={cat.name}>
                                    {cat.children && cat.children.length > 0 ? (
                                        cat.children.map(child => (
                                            <option key={child.id} value={child.id}>{child.name}</option>
                                        ))
                                    ) : (
                                        <option value={cat.id}>{cat.name}</option>
                                    )}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <textarea
                            id="description"
                            placeholder="Optionale Beschreibung der Dienstleistung"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                        {fieldErrors.description && (
                            <p className="text-sm text-red-600">{fieldErrors.description[0]}</p>
                        )}
                    </div>

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

                    <div className="space-y-2">
                        <Label htmlFor="buffer_after">Pufferzeit danach (Minuten)</Label>
                        <Input
                            id="buffer_after"
                            type="number"
                            min="0"
                            max="60"
                            step="5"
                            value={formData.buffer_after}
                            onChange={(e) => setFormData({ ...formData, buffer_after: parseInt(e.target.value) || 0 })}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">Zeit zwischen Terminen für Vorbereitung</p>
                    </div>

                    <div className="space-y-4">
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
                                Dienstleistung ist aktiv
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