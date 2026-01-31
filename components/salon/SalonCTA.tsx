import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface SalonCTAProps {
    slug: string
}

export default function SalonCTA({ slug }: SalonCTAProps) {
    return (
        <>
            {/* Desktop CTA section */}
            <section className="text-center py-12">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Bereit für Ihren nächsten Termin?
                </h2>
                <p className="text-gray-500 mb-6">
                    Schnell, einfach, ohne Anruf.
                </p>
                <Link
                    href={`/book/${slug}`}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Calendar className="w-5 h-5" />
                    Jetzt Termin buchen
                </Link>
            </section>

            {/* Mobile sticky button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg sm:hidden z-50">
                <Link
                    href={`/book/${slug}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Calendar className="w-5 h-5" />
                    Termin buchen
                </Link>
            </div>
        </>
    )
}
