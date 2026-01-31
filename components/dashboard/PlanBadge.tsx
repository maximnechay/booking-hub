// components/dashboard/PlanBadge.tsx

'use client'

import Link from 'next/link'
import { Crown, Sparkles, Building2 } from 'lucide-react'

interface PlanBadgeProps {
    planId: string
    planName: string
}

const planIcons = {
    starter: Sparkles,
    pro: Crown,
    business: Building2,
}

const planColors = {
    starter: 'bg-gray-100 text-gray-700',
    pro: 'bg-amber-100 text-amber-700',
    business: 'bg-violet-100 text-violet-700',
}

export default function PlanBadge({ planId, planName }: PlanBadgeProps) {
    const Icon = planIcons[planId as keyof typeof planIcons] || Sparkles
    const colorClass = planColors[planId as keyof typeof planColors] || planColors.starter

    return (
        <Link
            href="/dashboard/plan"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass} hover:opacity-80 transition-opacity`}
        >
            <Icon className="w-3.5 h-3.5" />
            {planName}
        </Link>
    )
}
