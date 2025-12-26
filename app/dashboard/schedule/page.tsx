// app/dashboard/schedule/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Building2, User } from 'lucide-react'

interface Staff {
    id: string
    name: string
}

interface BlockedDate {
    id: string
    staff_id: string | null
    blocked_date: string
    reason: string | null
    staff: { id: string; name: string } | null
}

export default function SchedulePage() {
    const [isLoading, setIsLoading] = useState(false)
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        staff_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    })

    // Загрузка данных
    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            // Загружаем blocked dates
            const blockedRes = await fetch('/api/blocked-dates')
            const blockedData = await blockedRes.json()
            if (blockedData.blocked_dates) {
                setBlockedDates(blockedData.blocked_dates)
            }

            // Загружаем staff
            const staffRes = await fetch('/api/staff')
            const staffData = await staffRes.json()
            if (staffData.staff) {
                setStaff(staffData.staff)
            }
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/blocked-dates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: formData.staff_id || null,
                    start_date: formData.start_date,
                    end_date: formData.end_date || formData.start_date,
                    reason: formData.reason || null,
                }),
            })

            if (!response.ok) {
                const result = await response.json()
                setError(result.error || 'Fehler beim Speichern')
                return
            }

            setFormData({ staff_id: '', start_date: '', end_date: '', reason: '' })
            setShowForm(false)
            loadData()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return

        try {
            const response = await fetch(`/api/blocked-dates/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                loadData()
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    // Группируем по типу (салон или мастер)
    const salonDates = blockedDates.filter(d => !d.staff_id)
    const staffDates = blockedDates.filter(d => d.staff_id)

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Freie Tage & Urlaub</h1>
                    <p className="text-gray-500 mt-1">Verwalten Sie Schließtage und Mitarbeiter-Urlaub</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Eintrag
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Freien Tag hinzufügen</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="staff_id">Für wen?</Label>
                            <select
                                id="staff_id"
                                value={formData.staff_id}
                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">🏢 Gesamter Salon (geschlossen)</option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>👤 {s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Von *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Bis (optional)</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    min={formData.start_date}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Grund (optional)</Label>
                            <Input
                                id="reason"
                                placeholder="z.B. Urlaub, Feiertag, Fortbildung..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Abbrechen
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Salon Schließtage */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-500" />
                        <h2 className="font-semibold text-gray-900">Salon Schließtage</h2>
                    </div>
                </div>
                {salonDates.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {salonDates.map((date) => (
                            <li key={date.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{formatDate(date.blocked_date)}</p>
                                    {date.reason && <p className="text-sm text-gray-500">{date.reason}</p>}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(date.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                        Keine Schließtage eingetragen
                    </div>
                )}
            </div>

            {/* Mitarbeiter Urlaub */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <h2 className="font-semibold text-gray-900">Mitarbeiter Urlaub</h2>
                    </div>
                </div>
                {staffDates.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {staffDates.map((date) => (
                            <li key={date.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {date.staff?.name} — {formatDate(date.blocked_date)}
                                    </p>
                                    {date.reason && <p className="text-sm text-gray-500">{date.reason}</p>}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(date.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                        Keine Urlaubstage eingetragen
                    </div>
                )}
            </div>
        </div>
    )
}