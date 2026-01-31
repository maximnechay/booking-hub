// components/dashboard/UsageBar.tsx

interface UsageBarProps {
    label: string
    current: number
    limit: number | null
    unit?: string
}

export default function UsageBar({ label, current, limit, unit = '' }: UsageBarProps) {
    const percentage = limit ? Math.min((current / limit) * 100, 100) : 0
    const isUnlimited = limit === null
    const isWarning = percentage >= 80
    const isError = percentage >= 100

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-900'}`}>
                    {current}{unit} {isUnlimited ? '' : `/ ${limit}${unit}`}
                    {isUnlimited && <span className="text-gray-400 ml-1">&infin;</span>}
                </span>
            </div>
            {!isUnlimited && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}
        </div>
    )
}
