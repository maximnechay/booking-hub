// app/dashboard/plan/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UsageBar from '@/components/dashboard/UsageBar'

interface Plan {
    id: string
    name: string
    price_monthly: number
    max_staff: number | null
    max_bookings_per_month: number | null
    max_locations: number | null
    feature_email_staff: boolean
    feature_reminder_24h: boolean
    feature_review_email: boolean
    feature_priority_support: boolean
}

interface Usage {
    bookings_count: number
    bookings_limit: number | null
    staff_count: number
    staff_limit: number | null
}

export default function PlanPage() {
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
    const [usage, setUsage] = useState<Usage | null>(null)
    const [allPlans, setAllPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isChanging, setIsChanging] = useState(false)

    useEffect(() => {
        loadPlanData()
    }, [])

    async function loadPlanData() {
        try {
            const res = await fetch('/api/plan')
            const data = await res.json()
            setCurrentPlan(data.current_plan)
            setUsage(data.usage)
            setAllPlans(data.available_plans || [])
        } catch (error) {
            console.error('Failed to load plan:', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleChangePlan(planId: string) {
        if (!confirm('Möchten Sie Ihren Plan wirklich ändern?')) return

        setIsChanging(true)
        try {
            const res = await fetch('/api/plan/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId })
            })

            if (res.ok) {
                loadPlanData()
            }
        } catch (error) {
            console.error('Failed to change plan:', error)
        } finally {
            setIsChanging(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-gray-500">Lädt...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Plan & Nutzung</h1>

            {/* Current Usage */}
            {usage && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                    <h2 className="font-semibold text-gray-900 mb-4">Aktuelle Nutzung</h2>
                    <div className="space-y-4">
                        <UsageBar
                            label="Termine diesen Monat"
                            current={usage.bookings_count}
                            limit={usage.bookings_limit}
                        />
                        <UsageBar
                            label="Mitarbeiter"
                            current={usage.staff_count}
                            limit={usage.staff_limit}
                        />
                    </div>
                </div>
            )}

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allPlans.map((plan) => {
                    const isCurrent = plan.id === currentPlan?.id
                    const isUpgrade = (currentPlan?.price_monthly || 0) < plan.price_monthly

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-lg border-2 p-6 ${
                                isCurrent
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg">{plan.name}</h3>
                                {isCurrent && (
                                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                        Aktuell
                                    </span>
                                )}
                            </div>

                            <p className="text-3xl font-bold text-gray-900 mb-4">
                                {(plan.price_monthly / 100).toFixed(0)}&euro;
                                <span className="text-sm font-normal text-gray-500">/Monat</span>
                            </p>

                            <ul className="space-y-2 text-sm mb-6">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    {plan.max_staff ? `Bis ${plan.max_staff} Mitarbeiter` : 'Unbegrenzte Mitarbeiter'}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    {plan.max_bookings_per_month ? `${plan.max_bookings_per_month} Termine/Monat` : 'Unbegrenzte Termine'}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    {plan.max_locations ? `${plan.max_locations} Standort` : 'Unbegrenzte Standorte'}
                                </li>
                                {plan.feature_email_staff && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Mitarbeiter-E-Mails
                                    </li>
                                )}
                                {plan.feature_reminder_24h && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Erinnerungen 24h
                                    </li>
                                )}
                                {plan.feature_review_email && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Bewertungs-E-Mail
                                    </li>
                                )}
                                {plan.feature_priority_support && (
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Priority Support
                                    </li>
                                )}
                            </ul>

                            {!isCurrent && (
                                <Button
                                    onClick={() => handleChangePlan(plan.id)}
                                    disabled={isChanging}
                                    className="w-full"
                                    variant={isUpgrade ? 'default' : 'outline'}
                                >
                                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>

            <p className="text-sm text-gray-500 mt-6 text-center">
                Hinweis: In der aktuellen Version wird der Plan sofort geändert.
                Stripe-Integration für automatische Abrechnung folgt.
            </p>
        </div>
    )
}
