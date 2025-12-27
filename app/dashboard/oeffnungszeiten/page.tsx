// app/dashboard/oeffnungszeiten/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))
const SELECT_CLASS = 'h-9 w-16 rounded-md border border-input bg-background px-2 py-2 text-sm tabular-nums'
const TIME_GROUP_CLASS = 'flex items-center gap-2'
const TIME_BLOCK_CLASS = 'flex flex-col gap-1'

interface WorkingHour {
    day_of_week: number
    open_time: string
    close_time: string
    is_open: boolean
}

const defaultWorkingHours: WorkingHour[] = WEEKDAYS.map((_, index) => ({
    day_of_week: index,
    open_time: '09:00',
    close_time: '18:00',
    is_open: index < 5,
}))

const normalizeTime = (value: string | null) => {
    if (!value) {
        return value
    }

    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)/)
    if (!match) {
        return value
    }

    return `${match[1]}:${match[2]}`
}

const getTimeParts = (value: string | null) => {
    if (!value) {
        return { hour: '00', minute: '00' }
    }

    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)/)
    if (!match) {
        return { hour: '00', minute: '00' }
    }

    return { hour: match[1], minute: match[2] }
}

export default function OpeningHoursPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [workingHours, setWorkingHours] = useState<WorkingHour[]>(defaultWorkingHours)

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch('/api/settings/working-hours')
                const result = await response.json()

                if (result.working_hours && result.working_hours.length > 0) {
                    const merged = defaultWorkingHours.map(day => {
                        const existing = result.working_hours.find(
                            (item: WorkingHour) => item.day_of_week === day.day_of_week
                        )
                        if (!existing) {
                            return day
                        }

                        return {
                            ...existing,
                            open_time: normalizeTime(existing.open_time) || day.open_time,
                            close_time: normalizeTime(existing.close_time) || day.close_time,
                            is_open: !!existing.is_open,
                        }
                    })
                    setWorkingHours(merged)
                }
            } catch (err) {
                console.error('Failed to load working hours:', err)
            } finally {
                setIsFetching(false)
            }
        }

        loadData()
    }, [])

    const updateDay = (dayIndex: number, updates: Partial<WorkingHour>) => {
        setWorkingHours(prev => prev.map((day, i) =>
            i === dayIndex ? { ...day, ...updates } : day
        ))
    }

    const updateTimeField = (
        dayIndex: number,
        field: 'open_time' | 'close_time',
        part: 'hour' | 'minute',
        value: string
    ) => {
        const current = workingHours[dayIndex]?.[field] ?? '00:00'
        const parts = getTimeParts(current)
        const nextHour = part === 'hour' ? value : parts.hour
        const nextMinute = part === 'minute' ? value : parts.minute
        updateDay(dayIndex, { [field]: `${nextHour}:${nextMinute}` })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/settings/working-hours', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workingHours),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'Fehler beim Speichern')
                return
            }
        } catch {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return <div className="p-8">Laden...</div>
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Offnungszeiten</h1>
                <p className="text-gray-500 mt-1">Arbeitszeiten des Salons</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {workingHours.map((day, index) => (
                            <div
                                key={day.day_of_week}
                                className={`p-4 border rounded-lg ${day.is_open ? 'bg-white' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={day.is_open}
                                            onChange={(e) => updateDay(index, { is_open: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label className="font-medium">{WEEKDAYS[index]}</Label>
                                    </div>
                                    {!day.is_open && (
                                        <span className="text-sm text-gray-500">Geschlossen</span>
                                    )}
                                </div>

                                <div className={`ml-7 flex flex-wrap items-start gap-x-8 gap-y-4 ${day.is_open ? '' : 'opacity-50'}`}>
                                    <div className={TIME_BLOCK_CLASS}>
                                        <Label className="text-xs text-gray-500">Offnet</Label>
                                        <div className={TIME_GROUP_CLASS}>
                                            <select
                                                className={SELECT_CLASS}
                                                value={getTimeParts(day.open_time).hour}
                                                onChange={(e) => updateTimeField(index, 'open_time', 'hour', e.target.value)}
                                                disabled={!day.is_open}
                                            >
                                                {HOURS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <span className="text-sm text-gray-400">:</span>
                                            <select
                                                className={SELECT_CLASS}
                                                value={getTimeParts(day.open_time).minute}
                                                onChange={(e) => updateTimeField(index, 'open_time', 'minute', e.target.value)}
                                                disabled={!day.is_open}
                                            >
                                                {MINUTES.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className={TIME_BLOCK_CLASS}>
                                        <Label className="text-xs text-gray-500">Schliesst</Label>
                                        <div className={TIME_GROUP_CLASS}>
                                            <select
                                                className={SELECT_CLASS}
                                                value={getTimeParts(day.close_time).hour}
                                                onChange={(e) => updateTimeField(index, 'close_time', 'hour', e.target.value)}
                                                disabled={!day.is_open}
                                            >
                                                {HOURS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <span className="text-sm text-gray-400">:</span>
                                            <select
                                                className={SELECT_CLASS}
                                                value={getTimeParts(day.close_time).minute}
                                                onChange={(e) => updateTimeField(index, 'close_time', 'minute', e.target.value)}
                                                disabled={!day.is_open}
                                            >
                                                {MINUTES.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
