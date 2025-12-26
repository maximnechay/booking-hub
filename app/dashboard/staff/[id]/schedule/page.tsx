// app/dashboard/staff/[id]/schedule/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

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
    end_time: '18:00',
    break_start: null,
    break_end: null,
    is_working: index < 5, // Пн-Пт работает
}))

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
                        return existing || day
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-7">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Start</Label>
                                            <Input
                                                type="time"
                                                lang="de"
                                                step={60}
                                                value={day.start_time}
                                                onChange={(e) => updateDay(index, { start_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Ende</Label>
                                            <Input
                                                type="time"
                                                lang="de"
                                                step={60}
                                                value={day.end_time}
                                                onChange={(e) => updateDay(index, { end_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Pause von</Label>
                                            <Input
                                                type="time"
                                                lang="de"
                                                step={60}
                                                value={day.break_start || ''}
                                                onChange={(e) => updateDay(index, { break_start: e.target.value || null })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">Pause bis</Label>
                                            <Input
                                                type="time"
                                                lang="de"
                                                step={60}
                                                value={day.break_end || ''}
                                                onChange={(e) => updateDay(index, { break_end: e.target.value || null })}
                                            />
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