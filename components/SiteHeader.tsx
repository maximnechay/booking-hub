import Link from "next/link"
import { Calendar } from "lucide-react"

export default function SiteHeader() {
  return (
    <nav className="fixed top-4 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">BookingHub</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 px-4 py-2">
                Anmelden
              </Link>
              <Link href="/register" className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg">
                Starten
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
