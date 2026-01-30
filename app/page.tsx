import Link from 'next/link'
import { Calendar, Users, Zap, Shield, ArrowRight, Play } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Über 500 aktive Nutzer
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                Termine online
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  automatisch
                </span>
                <br />
                verwalten
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-md">
                Das Buchungssystem, das Ihre Kunden lieben werden.
                Einfach einbetten, sofort loslegen.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-gray-900/10"
                >
                  Kostenlos starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/book/test-salon"
                  className="inline-flex items-center gap-2 text-gray-700 px-6 py-3.5 rounded-xl font-semibold border border-gray-200 bg-white"
                >
                  <Play className="w-4 h-4 text-blue-600" />
                  Live Demo
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <div className="flex">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full border-2 border-white ${i > 1 ? '-ml-2' : ''}`}
                      style={{
                        background: `linear-gradient(135deg, ${['#60a5fa', '#a78bfa', '#fb923c', '#34d399'][i - 1]} 0%, ${['#3b82f6', '#8b5cf6', '#f97316', '#10b981'][i - 1]} 100%)`
                      }}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">4.9/5 Bewertung</div>
                  <div className="text-gray-500">von 200+ Kunden</div>
                </div>
              </div>
            </div>

            {/* Right - Video */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 rounded-3xl blur-3xl"></div>

              {/* Video container */}
              <div className="relative aspect-[4/3] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* TODO: Замени на своё видео */}
                {/* Вариант 1: локальный файл */}
                {/* <video src="/demo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" /> */}

                {/* Вариант 2: YouTube embed */}
                {/* <iframe src="https://www.youtube.com/embed/VIDEO_ID" className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen /> */}


              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Alles was Sie brauchen
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-500">
              Professionelle Features, einfach zu bedienen
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, title: '24/7 Buchungen', desc: 'Kunden buchen jederzeit', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Users, title: 'Team verwalten', desc: 'Mehrere Mitarbeiter', color: 'text-violet-500', bg: 'bg-violet-50' },
              { icon: Zap, title: 'Sofort startklar', desc: '5 Minuten Setup', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Shield, title: 'DSGVO-konform', desc: 'Sichere Daten', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-12 sm:p-16">
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>

            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Bereit für mehr Buchungen?
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-md mx-auto">
                Starten Sie kostenlos und erleben Sie, wie einfach Online-Terminbuchung sein kann.
              </p>
              <div className="flex flex-col items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold"
                >
                  Jetzt kostenlos starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="text-gray-400 font-medium hover:text-gray-300">
                  Oder anmelden →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
            <Link href="/impressum" className="text-sm text-gray-500 hover:text-gray-700">Impressum</Link>
            <Link href="/datenschutz" className="text-sm text-gray-500 hover:text-gray-700">Datenschutz</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Anmelden</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
