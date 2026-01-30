import type { ReactNode } from 'react'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-white text-gray-900">
            <header className="border-b border-gray-200">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2 text-gray-900">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                            <Calendar className="h-4 w-4 text-white" />
                        </span>
                        <span className="text-sm font-semibold tracking-tight">BookingHub</span>
                    </Link>
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        Zur Startseite
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl px-6 py-10">
                {children}
            </main>

            <footer className="border-t border-gray-200">
                <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 px-6 py-6 text-sm text-gray-600">
                    <Link href="/impressum" className="hover:text-gray-900">
                        Impressum
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/datenschutz" className="hover:text-gray-900">
                        Datenschutz
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/" className="hover:text-gray-900">
                        Zurück zur Startseite
                    </Link>
                </div>
            </footer>
        </div>
    )
}
