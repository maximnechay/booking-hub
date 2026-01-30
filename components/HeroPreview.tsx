'use client'

import { useMemo, useState } from 'react'
import { Calendar, Play } from 'lucide-react'

type DateInput = Date | string | number

const startOfWeek = (date: DateInput): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export default function HeroPreview() {
    const [selectedIndex, setSelectedIndex] = useState<number>(3)
    const openDemo = () => {
        window.open('/book/test-salon', '_blank', 'noopener,noreferrer')
    }

    const weekDays = useMemo<Date[]>(() => {
        const weekStart = startOfWeek(new Date())
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart)
            d.setDate(weekStart.getDate() + i)
            return d
        })
    }, [])

    const slotsByDay = useMemo<string[][]>(
        () => [
            ['09:00', '10:30', '12:00'],
            ['10:00', '11:30', '14:00'],
            ['09:30', '13:00', '16:30'],
            ['10:00', '12:30', '14:30', '17:00'],
            ['09:00', '11:00', '15:30'],
            ['10:30', '13:30'],
            ['11:00', '14:00'],
        ],
        []
    )

    const slots = slotsByDay[selectedIndex] ?? []

    return (
        <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 rounded-3xl blur-3xl" />

            <div
                role="button"
                tabIndex={0}
                onClick={openDemo}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openDemo()
                }}
                className="group relative block rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                aria-label="Live Demo öffnen"
            >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent via-transparent to-black/10" />

                <div className="pointer-events-none absolute top-4 right-4 inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    <Play className="w-4 h-4" />
                    Live Demo öffnen
                </div>

                <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs text-gray-500">bookinghub.app</div>
                    <div className="w-10" />
                </div>

                <div className="p-6">
                    <div className="w-full">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Salon</div>
                                <div className="text-lg font-bold text-gray-900">Test Studio Berlin</div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                                2 Slots frei heute
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                <div className="text-xs text-gray-500">Service</div>
                                <div className="mt-1 font-semibold text-gray-900">Damen Haarschnitt</div>
                                <div className="mt-1 text-sm text-gray-500">60 Min · 49€</div>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                <div className="text-xs text-gray-500">Mitarbeiter</div>
                                <div className="mt-1 font-semibold text-gray-900">Maria K.</div>
                                <div className="mt-1 text-sm text-gray-500">Haarschnitt · Styling</div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-900">Kalender</div>
                                <div className="text-xs text-gray-500">Diese Woche</div>
                            </div>

                            <div className="mt-3 grid grid-cols-7 gap-2">
                                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                                    <div key={d} className="text-[11px] text-gray-500 text-center">
                                        {d}
                                    </div>
                                ))}

                                {weekDays.map((date, i) => {
                                    const isSelected = i === selectedIndex
                                    const isToday = new Date().toDateString() === date.toDateString()

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedIndex(i)
                                            }}
                                            className={[
                                                "h-10 rounded-lg border flex items-center justify-center text-sm font-semibold transition-colors",
                                                isSelected
                                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                                                isToday ? "ring-2 ring-indigo-200" : "",
                                            ].join(" ")}
                                            aria-label={`Tag auswählen: ${date.getDate()}`}
                                        >
                                            <div className="flex flex-col items-center leading-none">
                                                <div>{date.getDate()}</div>
                                                <div className="mt-1 flex gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {slots.map((t, idx) => (
                                    <span
                                        key={t}
                                        className={[
                                            "px-3 py-1 rounded-full text-xs font-semibold border",
                                            idx === Math.min(2, slots.length - 1)
                                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 bg-white text-gray-700",
                                        ].join(" ")}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    openDemo()
                                }}
                                className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold text-center"
                            >
                                Termin buchen
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    openDemo()
                                }}
                                className="px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 bg-white"
                            >
                                Details
                            </button>
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                            <div className="text-sm font-semibold text-emerald-900">Buchung bestätigt</div>
                            <div className="text-sm text-emerald-800">Mi, 14:30 · Damen Haarschnitt · Maria K.</div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                            Vorschau. Klicken, um die Live-Demo zu öffnen.
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-5 left-6 inline-flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-full px-4 py-2 text-sm font-semibold text-gray-900">
                <Calendar className="w-4 h-4 text-indigo-600" />
                24/7 Buchungen
            </div>
        </div>
    )
}
