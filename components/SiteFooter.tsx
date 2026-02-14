import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm text-gray-500 mb-8">
          Die moderne Online-Terminbuchung für Salons und Dienstleister in Deutschland
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-gray-900">BookingHub</span>
            <span className="text-gray-400">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Preise</Link>
            <Link href="/kontakt" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Kontakt</Link>
            <Link href="/impressum" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Datenschutz</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Anmelden</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
