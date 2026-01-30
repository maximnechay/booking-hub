import Link from 'next/link'
import { Calendar, Users, Zap, Shield, ArrowRight, Play, Sparkles, Building2, MousePointerClick, SlidersHorizontal, BadgeEuro } from 'lucide-react'
import HeroPreview from '../components/HeroPreview'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const segments = [
  {
    name: 'Einzelmeister',
    description: 'Schnell online buchbar - perfekt für Instagram.',
    promise: 'Ein Link und fertig',
    bullets: ['Link in Bio für Instagram', 'Nur freie Zeiten sichtbar', 'Bestätigung in Sekunden'],
    primary: { label: 'Demo ansehen', href: '/book/test-salon' },
    secondary: { label: 'Kostenlos starten', href: '/register' },
    badge: null,
    badgeClassName: '',
    icon: Sparkles,
    styles: {
      card: 'bg-white',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-50',
      promise: 'text-amber-700',
    },
  },
  {
    name: 'Salon',
    description: 'Team, Services und Kalender - ohne Chaos.',
    promise: 'Team, Services, Kalender - alles an einem Ort',
    bullets: ['Mitarbeiter & Leistungen verwalten', 'Pausen, Dauer, Regeln pro Service', 'Übersichtlicher Tagesplan'],
    primary: { label: 'Demo ansehen', href: '/book/test-salon' },
    secondary: { label: 'Kostenlos starten', href: '/register' },
    badge: 'Empfohlen',
    badgeClassName: 'bg-gray-900 text-white',
    icon: Users,
    styles: {
      card: 'bg-blue-50/60',
      icon: 'text-blue-600',
      iconBg: 'bg-white',
      promise: 'text-blue-700',
    },
  },
  {
    name: 'Studio-Kette',
    description: 'Mehrere Standorte, ein System - bereit fürs Wachstum.',
    promise: 'Mehrere Standorte, ein System',
    bullets: ['Standorte getrennt oder zentral', 'Einheitliche Buchungsregeln', 'Skalierbar, wenn Sie wachsen'],
    primary: { label: 'Kostenlos starten', href: '/register' },
    secondary: { label: 'Demo ansehen', href: '/book/test-salon' },
    badge: 'Pro',
    badgeClassName: 'bg-white text-gray-900',
    icon: Building2,
    styles: {
      card: 'bg-gray-900 text-white',
      icon: 'text-white',
      iconBg: 'bg-white/10',
      promise: 'text-white/80',
    },
  },
] as const


export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader />
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  In 10 Minuten eingerichtet
                </span>
                <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  DSGVO-ready
                </span>
                <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Ohne App
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                Online-Termine für Salons
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  ohne WhatsApp-Chaos
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-lg">
                Kunden buchen selbstständig 24/7. Sie behalten den Überblick über Team, Services und Zeiten - automatisch.
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
                  className="inline-flex items-center gap-2 text-gray-700 px-6 py-3.5 rounded-xl font-semibold border border-gray-200 bg-white hover:bg-gray-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="w-4 h-4 text-blue-600" />
                  Live Demo
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  <div className="text-sm text-gray-500">Weniger No-Shows</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">+ Erinnerungen</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  <div className="text-sm text-gray-500">Mehr Buchungen</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">24/7 Online</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200">
                  <div className="text-sm text-gray-500">Zeit sparen</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">Kein Hin-und-her</div>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-8">
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
                  <div className="text-gray-500">aus echten Salon-Buchungen</div>
                </div>
              </div>
            </div>

            {/* Right */}
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Für wen ist BookingHub?
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-500">
              Wählen Sie, was zu Ihrem Business passt und starten Sie in wenigen Minuten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {segments.map((segment) => {
              const isDemo = segment.primary.href === '/book/test-salon'
              return (
                <Link
                  key={segment.name}
                  href={segment.primary.href}
                  target={isDemo ? '_blank' : undefined}
                  rel={isDemo ? 'noopener noreferrer' : undefined}
                  className={`group relative h-full rounded-3xl border border-gray-200 p-8 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:border-gray-300 ${segment.styles.card}`}
                >
                {segment.badge && (
                  <div className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold ${segment.badgeClassName}`}>
                    {segment.badge}
                  </div>
                )}

                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${segment.styles.iconBg}`}>
                  <segment.icon className={`h-6 w-6 ${segment.styles.icon}`} />
                </div>

                <h3 className="text-xl font-bold mb-2">{segment.name}</h3>
                <p className={`text-sm ${segment.name === 'Studio-Kette' ? 'text-white/70' : 'text-gray-600'}`}>
                  {segment.description}
                </p>
                <div className={`mt-4 text-sm font-semibold ${segment.styles.promise}`}>{segment.promise}</div>

                <ul className={`mt-5 space-y-2 text-sm ${segment.name === 'Studio-Kette' ? 'text-white/80' : 'text-gray-600'}`}>
                  {segment.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span
                        className={`mt-2 h-1.5 w-1.5 rounded-full ${segment.name === 'Studio-Kette' ? 'bg-white/70' : 'bg-gray-400'}`}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 space-y-2">
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                      segment.name === 'Studio-Kette'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-900 text-white'
                    }`}
                  >
                    {segment.primary.label}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      segment.name === 'Studio-Kette' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {segment.secondary.label} →
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why BookingHub */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Warum BookingHub?
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-500">
              Einfach, schnell und fair - ohne unnötige Komplexität.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <MousePointerClick className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Einfach für Kunden</h3>
              <p className="text-sm text-gray-600">
                Keine App. Keine Registrierung. In wenigen Klicks gebucht.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Zap className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schnell startklar</h3>
              <p className="text-sm text-gray-600">
                Services, Zeiten, Team eintragen - fertig. Läuft sofort.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <SlidersHorizontal className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nur das, was Sie brauchen</h3>
              <p className="text-sm text-gray-600">
                Keine überladenen Systeme. Sie zahlen nicht für Funktionen, die Sie nie nutzen.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-900 p-6 text-white">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BadgeEuro className="h-5 w-5 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold mb-3">
                Keine Provision
              </div>
              <h3 className="text-lg font-semibold mb-2">Fairer Preis</h3>
              <p className="text-sm text-white/80">
                Keine Provision pro Buchung. Nur eine klare Abogebühr.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Admin-Bereich wird laufend verbessert - die Buchung für Kunden ist bereits schnell und stabil.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-gray-900/10"
            >
              Preise ansehen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-gray-700 px-6 py-3.5 rounded-xl font-semibold border border-gray-200 bg-white hover:bg-gray-50"
            >
              Kostenlos starten
            </Link>
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

      <SiteFooter />
    </div>
  )
}
