// app/dashboard/staff/staff-list.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StaffMember {
    id: string
    name: string
    email: string | null
    phone: string | null
    is_active: boolean | null
    services: { service: { id: string; name: string } }[]
}

export default function StaffList({ staff }: { staff: StaffMember[] }) {
    const [items, setItems] = useState<StaffMember[]>(staff)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Mitarbeiter wirklich löschen?')) return
        setDeletingId(id)
        setError(null)

        try {
            const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
            if (!response.ok) {
                const result = await response.json().catch(() => ({}))
                if (result.error === 'Cannot delete staff with active bookings') {
                    setError('Mitarbeiter kann nicht gelöscht werden, da noch aktive Buchungen vorhanden sind')
                } else {
                    setError(result.error || 'Fehler beim Löschen')
                }
                return
            }
            setItems(prev => prev.filter(item => item.id !== id))
        } catch {
            setError('Fehler beim Löschen')
        } finally {
            setDeletingId(null)
        }
    }

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Noch keine Mitarbeiter vorhanden</p>
                <Link href="/dashboard/staff/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ersten Mitarbeiter hinzufügen
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
                {items.map((member) => (
                    <div key={member.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                    {member.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${member.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {member.is_active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                            {member.email && <p>{member.email}</p>}
                            {member.phone && <p>{member.phone}</p>}
                            {!member.email && !member.phone && <p className="text-gray-400">-</p>}
                        </div>
                        <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                                {member.services && member.services.length > 0 ? (
                                    member.services.slice(0, 3).map((s) => (
                                        <span
                                            key={s.service.id}
                                            className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                        >
                                            {s.service.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-400">Keine</span>
                                )}
                                {member.services && member.services.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                        +{member.services.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Link href={`/dashboard/staff/${member.id}/schedule`} className="flex-1">
                                <Button variant="ghost" size="sm" className="w-full justify-center" title="Arbeitszeiten">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Zeiten
                                </Button>
                            </Link>
                            <Link href={`/dashboard/staff/${member.id}/edit`} className="flex-1">
                                <Button variant="ghost" size="sm" className="w-full justify-center">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Bearbeiten
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 w-full justify-center text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(member.id)}
                                disabled={deletingId === member.id}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-600">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900">{member.name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {member.email && <p>{member.email}</p>}
                                    {member.phone && <p>{member.phone}</p>}
                                    {!member.email && !member.phone && <p className="text-gray-400">—</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {member.services && member.services.length > 0 ? (
                                            member.services.slice(0, 3).map((s) => (
                                                <span
                                                    key={s.service.id}
                                                    className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                                >
                                                    {s.service.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">Keine</span>
                                        )}
                                        {member.services && member.services.length > 3 && (
                                            <span className="text-xs text-gray-500">
                                                +{member.services.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {member.is_active ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/staff/${member.id}/schedule`}>
                                            <Button variant="ghost" size="sm" title="Arbeitszeiten">
                                                <Clock className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/staff/${member.id}/edit`}>
                                            <Button variant="ghost" size="sm">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(member.id)}
                                            disabled={deletingId === member.id}
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
