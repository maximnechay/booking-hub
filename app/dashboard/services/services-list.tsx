// app/dashboard/services/services-list.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Service {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    is_active: boolean | null
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

export default function ServicesList({ services }: { services: Service[] }) {
    const [items, setItems] = useState<Service[]>(services)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Dienstleistung wirklich loschen?')) return
        setDeletingId(id)
        setError(null)

        try {
            const response = await fetch(`/api/services/${id}`, { method: 'DELETE' })
            if (!response.ok) {
                const result = await response.json().catch(() => ({}))
                setError(result.error || 'Fehler beim Loschen')
                return
            }
            setItems(prev => prev.filter(item => item.id !== id))
        } catch {
            setError('Fehler beim Loschen')
        } finally {
            setDeletingId(null)
        }
    }

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Noch keine Dienstleistungen vorhanden</p>
                <Link href="/dashboard/services/new">
                    <Button>
                        Neue Dienstleistung
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div>
            {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}
            <div className="space-y-4 md:hidden">
                {items.map((service) => (
                    <div key={service.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-medium text-gray-900">{service.name}</p>
                                {service.description && (
                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                )}
                            </div>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${service.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {service.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                        </div>
                        <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-3">
                            <span>{formatDuration(service.duration)}</span>
                            <span>{formatPrice(service.price)}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Link href={`/dashboard/services/${service.id}/variants`} className="flex-1">
                                <Button variant="ghost" size="sm" className="w-full justify-center" title="Varianten">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Varianten
                                </Button>
                            </Link>
                            <Link href={`/dashboard/services/${service.id}/edit`} className="flex-1">
                                <Button variant="ghost" size="sm" className="w-full justify-center">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Bearbeiten
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 w-full justify-center text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(service.id)}
                                disabled={deletingId === service.id}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Loschen
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dauer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{service.name}</p>
                                        {service.description && (
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{service.description}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDuration(service.duration)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {formatPrice(service.price)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${service.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {service.is_active ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/services/${service.id}/variants`}>
                                            <Button variant="ghost" size="sm" title="Varianten">
                                                <Layers className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/services/${service.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(service.id)}
                                            disabled={deletingId === service.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
