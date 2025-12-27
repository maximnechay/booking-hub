// app/dashboard/staff/[id]/schedule/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))
const SELECT_CLASS = 'h-10 w-16 rounded-md border border-input bg-background px-2 py-2 text-sm tabular-nums'
const TIME_GROUP_CLASS = 'flex items-center gap-2'
const TIME_BLOCK_CLASS = 'flex flex-col gap-1'

interface ScheduleDay {
    day_of_week: number
    start_time: string
    end_time: string
    break_start: string | null
    break_end: string | null
    is_working: boolean
}

const defaultSchedule: ScheduleDay[] = WEEKDAYS.map((_, index) => ({
    day_of_week: index,
    start_time: '09:00',
    end_time: '20:00',
    break_start: null,
    break_end: null,
    is_working: index < 5, // Пн-Пт работает
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
        return { hour: '', minute: '' }
    }

    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)/)
    if (!match) {
        return { hour: '00', minute: '00' }
    }

    return { hour: match[1], minute: match[2] }
}

export default function StaffSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [staffName, setStaffName] = useState('')
    const [schedule, setSchedule] = useState<ScheduleDay[]>(defaultSchedule)

    useEffect(() => {
        async function loadData() {
            try {
                // Загружаем мастера
                const staffRes = await fetch(`/api/staff/${id}`)
                const staffData = await staffRes.json()
                if (staffData.staff) {
                    setStaffName(staffData.staff.name)
                }

                // Загружаем расписание
                const scheduleRes = await fetch(`/api/staff/${id}/schedule`)
                const scheduleData = await scheduleRes.json()

                if (scheduleData.schedule && scheduleData.schedule.length > 0) {
                    // Объединяем с дефолтным расписанием
                    const merged = defaultSchedule.map(day => {
                        const existing = scheduleData.schedule.find(
                            (s: ScheduleDay) => s.day_of_week === day.day_of_week
                        )
                        if (!existing) {
                            return day
                        }

                        return {
                            ...existing,
                            start_time: normalizeTime(existing.start_time) || day.start_time,
                            end_time: normalizeTime(existing.end_time) || day.end_time,
                            break_start: normalizeTime(existing.break_start),
                            break_end: normalizeTime(existing.break_end),
                        }
                    })
                    setSchedule(merged)
                }
            } catch (err) {
                console.error('Failed to load data:', err)
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }, [id])

    const updateDay = (dayIndex: number, updates: Partial<ScheduleDay>) => {
        setSchedule(prev => prev.map((day, i) =>
            i === dayIndex ? { ...day, ...updates } : day
        ))
    }

    const updateTimeField = (
        dayIndex: number,
        field: 'start_time' | 'end_time' | 'break_start' | 'break_end',
        part: 'hour' | 'minute',
        value: string,
        allowEmpty = false
    ) => {
        const current = schedule[dayIndex]?.[field] ?? null
        const parts = getTimeParts(current)

        if (allowEmpty && value === '') {
            if (part === 'hour' && parts.minute !== '') {
                return updateDay(dayIndex, { [field]: null })
            }
            if (part === 'minute' && parts.hour !== '') {
                return updateDay(dayIndex, { [field]: null })
            }
            return updateDay(dayIndex, { [field]: null })
        }

        const nextHour = part === 'hour' ? value : (parts.hour || '00')
        const nextMinute = part === 'minute' ? value : (parts.minute || '00')
        updateDay(dayIndex, { [field]: `${nextHour}:${nextMinute}` })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/staff/${id}/schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule),
            })

            const result = await response.json()

            if (!response.ok) {
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
        return <div className="p-8">Laden...</div>
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
                <h1 className="text-2xl font-bold text-gray-900">
                    Arbeitszeiten: {staffName}
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {schedule.map((day, index) => (
                            <div
                                key={day.day_of_week}
                                className={`p-4 border rounded-lg ${day.is_working ? 'bg-white' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={day.is_working}
                                            onChange={(e) => updateDay(index, { is_working: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label className="font-medium">{WEEKDAYS[index]}</Label>
                                    </div>
                                    {!day.is_working && (
                                        <span className="text-sm text-gray-500">Frei</span>
                                    )}
                                </div>

                                {day.is_working && (
                                    <div className="ml-7 flex flex-wrap items-start gap-x-8 gap-y-4">
                                        <div className={TIME_BLOCK_CLASS}>
                                            <Label className="text-xs text-gray-500">Start</Label>
                                            <div className={TIME_GROUP_CLASS}>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.start_time).hour}
                                                    onChange={(e) => updateTimeField(index, 'start_time', 'hour', e.target.value)}
                                                >
                                                    {HOURS.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400">:</span>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.start_time).minute}
                                                    onChange={(e) => updateTimeField(index, 'start_time', 'minute', e.target.value)}
                                                >
                                                    {MINUTES.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className={TIME_BLOCK_CLASS}>
                                            <Label className="text-xs text-gray-500">Ende</Label>
                                            <div className={TIME_GROUP_CLASS}>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.end_time).hour}
                                                    onChange={(e) => updateTimeField(index, 'end_time', 'hour', e.target.value)}
                                                >
                                                    {HOURS.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400">:</span>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.end_time).minute}
                                                    onChange={(e) => updateTimeField(index, 'end_time', 'minute', e.target.value)}
                                                >
                                                    {MINUTES.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className={TIME_BLOCK_CLASS}>
                                            <Label className="text-xs text-gray-500">Pause von</Label>
                                            <div className={TIME_GROUP_CLASS}>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.break_start).hour}
                                                    onChange={(e) => updateTimeField(index, 'break_start', 'hour', e.target.value, true)}
                                                >
                                                    <option value="">--</option>
                                                    {HOURS.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400">:</span>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.break_start).minute}
                                                    onChange={(e) => updateTimeField(index, 'break_start', 'minute', e.target.value, true)}
                                                >
                                                    <option value="">--</option>
                                                    {MINUTES.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className={TIME_BLOCK_CLASS}>
                                            <Label className="text-xs text-gray-500">Pause bis</Label>
                                            <div className={TIME_GROUP_CLASS}>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.break_end).hour}
                                                    onChange={(e) => updateTimeField(index, 'break_end', 'hour', e.target.value, true)}
                                                >
                                                    <option value="">--</option>
                                                    {HOURS.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400">:</span>
                                                <select
                                                    className={SELECT_CLASS}
                                                    value={getTimeParts(day.break_end).minute}
                                                    onChange={(e) => updateTimeField(index, 'break_end', 'minute', e.target.value, true)}
                                                >
                                                    <option value="">--</option>
                                                    {MINUTES.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                                                onClick={() => updateDay(index, { break_start: null, break_end: null })}
                                            >
                                                Pause loschen
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
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
