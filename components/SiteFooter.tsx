import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-900">BookingHub</span>
          <span className="text-gray-400">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">Preise</Link>
          <Link href="/kontakt" className="text-sm text-gray-500 hover:text-gray-700">Kontakt</Link>
          <Link href="/impressum" className="text-sm text-gray-500 hover:text-gray-700">Impressum</Link>
          <Link href="/datenschutz" className="text-sm text-gray-500 hover:text-gray-700">Datenschutz</Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Anmelden</Link>
        </div>
      </div>
    </footer>
  )
}
