import type { ReactNode } from 'react'
import Link from 'next/link'

type LegalFooterProps = {
    children?: ReactNode
    className?: string
}

export default function LegalFooter({ children, className }: LegalFooterProps) {
    return (
        <footer className={`border-t border-gray-200 bg-white ${className ?? ''}`}>
            {children}
            <div className={`mx-auto max-w-6xl px-6 py-6 text-xs text-gray-500 flex flex-wrap items-center gap-2 ${children ? 'mt-4' : ''}`}>
                <Link href="/impressum" className="hover:text-gray-700">
                    Impressum
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/datenschutz" className="hover:text-gray-700">
                    Datenschutz
                </Link>
            </div>
        </footer>
    )
}
