'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Service {
    id: string
    name: string
    duration: number
    price: number
    description?: string | null
}

interface Category {
    id: string
    name: string
    services: Service[]
}

interface SalonServicesProps {
    categories: Category[]
    uncategorized: Service[]
}

function formatPrice(price: number): string {
    if (price === 0) return 'Gratis'
    return (price / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function ServiceRow({ service }: { service: Service }) {
    return (
        <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0">
            <div className="min-w-0">
                <p className="text-gray-900 font-medium">{service.name}</p>
                {service.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                )}
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4 text-sm text-gray-500">
                <span>{service.duration} Min</span>
                <span className="font-medium text-gray-900">{formatPrice(service.price)}</span>
            </div>
        </div>
    )
}

function CategoryAccordion({ category, defaultOpen }: { category: Category; defaultOpen: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <span className="font-semibold text-gray-900">{category.name}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div>
                    {category.services.map(service => (
                        <ServiceRow key={service.id} service={service} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function SalonServices({ categories, uncategorized }: SalonServicesProps) {
    const allCategories = [
        ...categories,
        ...(uncategorized.length > 0
            ? [{ id: '__uncategorized', name: 'Weitere Dienstleistungen', services: uncategorized }]
            : []),
    ]

    if (allCategories.length === 0) return null

    return (
        <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unsere Dienstleistungen</h2>
            <div className="space-y-3">
                {allCategories.map((cat, index) => (
                    <CategoryAccordion
                        key={cat.id}
                        category={cat}
                        defaultOpen={index === 0}
                    />
                ))}
            </div>
        </section>
    )
}
