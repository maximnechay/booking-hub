export default function SalonLoading() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero skeleton */}
            <div className="w-full h-56 sm:h-72 md:h-80 bg-gray-200 animate-pulse relative">
                <div className="absolute bottom-8 left-4 max-w-4xl mx-auto flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300" />
                    <div>
                        <div className="h-8 w-48 bg-gray-300 rounded" />
                        <div className="h-4 w-64 bg-gray-300 rounded mt-2" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
                {/* Info skeleton */}
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Services skeleton */}
                <div>
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                    {[1, 2].map(i => (
                        <div key={i} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50">
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="flex justify-between">
                                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Team skeleton */}
                <div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col items-center p-4">
                                <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-3" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}
