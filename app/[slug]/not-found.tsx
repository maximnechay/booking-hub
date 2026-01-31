import Link from 'next/link'

export default function SalonNotFound() {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Salon nicht gefunden
                </h2>
                <p className="text-gray-500 mb-6">
                    Der gesuchte Salon existiert nicht oder ist nicht mehr verfügbar.
                </p>
                <Link
                    href="/"
                    className="inline-flex px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Zur Startseite
                </Link>
            </div>
        </main>
    )
}
