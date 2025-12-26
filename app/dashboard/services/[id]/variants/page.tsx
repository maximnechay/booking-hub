// app/dashboard/services/[id]/variants/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'

interface Service {
    id: string
    name: string
}

interface Variant {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    sort_order: number
    is_active: boolean
}

export default function ServiceVariantsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [service, setService] = useState<Service | null>(null)
    const [variants, setVariants] = useState<Variant[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 30,
        price: '',
        sort_order: 0,
        is_active: true,
    })

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        try {
            // Загружаем услугу
            const serviceRes = await fetch(`/api/services/${id}`)
            const serviceData = await serviceRes.json()
            if (serviceData.service) {
                setService(serviceData.service)
            }

            // Загружаем варианты
            const variantsRes = await fetch(`/api/services/${id}/variants`)
            const variantsData = await variantsRes.json()
            if (variantsData.variants) {
                setVariants(variantsData.variants)
            }
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            duration: 30,
            price: '',
            sort_order: variants.length,
            is_active: true,
        })
        setEditingVariant(null)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const priceInCents = Math.round(parseFloat(formData.price || '0') * 100)

            const url = editingVariant
                ? `/api/services/${id}/variants/${editingVariant.id}`
                : `/api/services/${id}/variants`

            const response = await fetch(url, {
                method: editingVariant ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    duration: formData.duration,
                    price: priceInCents,
                    sort_order: formData.sort_order,
                    is_active: formData.is_active,
                }),
            })

            if (!response.ok) {
                const result = await response.json()
                setError(result.error || 'Fehler beim Speichern')
                return
            }

            resetForm()
            setShowForm(false)
            loadData()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (variant: Variant) => {
        setFormData({
            name: variant.name,
            description: variant.description || '',
            duration: variant.duration,
            price: (variant.price / 100).toFixed(2),
            sort_order: variant.sort_order,
            is_active: variant.is_active,
        })
        setEditingVariant(variant)
        setShowForm(true)
    }

    const handleDelete = async (variantId: string) => {
        if (!confirm('Variante wirklich löschen?')) return

        try {
            const response = await fetch(`/api/services/${id}/variants/${variantId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                loadData()
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
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

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/dashboard/services"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück zu Services
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    Varianten: {service?.name || 'Laden...'}
                </h1>
                <p className="text-gray-500 mt-1">
                    Verschiedene Optionen für diese Dienstleistung (z.B. Kurz, Mittel, Lang)
                </p>
            </div>

            <div className="flex justify-end mb-6">
                <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Variante
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingVariant ? 'Variante bearbeiten' : 'Neue Variante'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="z.B. KURZ | bis kinnlänge"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Beschreibung</Label>
                            <Input
                                id="description"
                                placeholder="Optionale Beschreibung"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
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
                                    required
                                />
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_active" className="font-normal">Aktiv</Label>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                                Abbrechen
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Variants List */}
            <div className="bg-white rounded-lg shadow">
                {variants.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {variants.map((variant) => (
                            <li key={variant.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <GripVertical className="h-5 w-5 text-gray-300" />
                                    <div>
                                        <p className="font-medium text-gray-900">{variant.name}</p>
                                        {variant.description && (
                                            <p className="text-sm text-gray-500">{variant.description}</p>
                                        )}
                                        <p className="text-sm text-gray-400 mt-1">
                                            {formatDuration(variant.duration)} · {formatPrice(variant.price)}
                                        </p>
                                    </div>
                                    {!variant.is_active && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Inaktiv</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(variant)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDelete(variant.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-500">
                        <p className="mb-4">Keine Varianten vorhanden</p>
                        <p className="text-sm">
                            Varianten sind optional. Fügen Sie sie hinzu, wenn Ihre Dienstleistung
                            verschiedene Optionen hat (z.B. kurze/mittlere/lange Haare).
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}