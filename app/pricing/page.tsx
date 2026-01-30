import Link from 'next/link'
import { CheckCircle2, Shield, Zap, BadgeCheck } from 'lucide-react'
import PricingPlans from '../../components/PricingPlans'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'

export const metadata = {
  title: 'Preise | BookingHub',
  description: 'Keine Provision pro Buchung. Flexible Buchungsregeln. Faire Abos für Salons.',
}

const plans = [
  {
    name: 'Starter',
    priceMonthly: 9,
    description: 'Für Solo & kleine Teams',
    badge: null,
    features: [
      'Bis zu 3 Mitarbeiter',
      'Bis zu 100 Termine/Monat',
      'E-Mail: Admin + Kunde',
      'Ohne Erinnerungen',
      'Ohne Bewertungs-E-Mail',
    ],
    cta: { label: 'Kostenlos starten', href: '/register' },
  },
  {
    name: 'Pro',
    priceMonthly: 19,
    description: 'Für wachsende Salons',
    badge: 'Empfohlen',
    features: [
      'Bis zu 10 Mitarbeiter',
      'Bis zu 300 Termine/Monat',
      'E-Mails: Admin + Kunde + Mitarbeiter',
      'Erinnerung 24h (Kunde)',
      'Bewertungs-E-Mail nach Termin',
    ],
    cta: { label: 'Kostenlos starten', href: '/register' },
  },
  {
    name: 'Business',
    priceMonthly: 39,
    description: 'Für mehrere Standorte',
    badge: null,
    features: [
      'Unbegrenzte Mitarbeiter',
      'Unbegrenzte Termine',
      'Mehrere Standorte',
      'Priorisierter Support',
    ],
    cta: { label: 'Kostenlos starten', href: '/register' },
  },
] as const

const included = [
  'Individuelle Buchungsregeln (Pausen, Vorlaufzeit, Buchungsfenster)',
  'Öffnungszeiten',
  'Services mit Dauer & Preis',
  'Buchungslink / Einbettung',
  'E-Mail Bestätigung (Basis)',
  'DSGVO-konform',
  'Keine Provision pro Buchung',
] as const

const comparison = [
  { label: 'Buchungsregeln', values: ['yes', 'yes', 'yes'] },
  { label: 'Email Admin/Kunde', values: ['yes', 'yes', 'yes'] },
  { label: 'Email Mitarbeiter', values: ['no', 'yes', 'yes'] },
  { label: 'Erinnerungen 24h', values: ['no', 'yes', 'yes'] },
  { label: 'Bewertungs-E-Mail', values: ['no', 'yes', 'yes'] },
  { label: 'Mitarbeiterlimit', values: ['Bis 3', 'Bis 10', 'Unbegrenzt'] },
  { label: 'Terminlimit', values: ['100/Monat', '300/Monat', 'Unbegrenzt'] },
  { label: 'Mehrere Standorte', values: ['no', 'no', 'yes'] },
  { label: 'Support-Priority', values: ['no', 'no', 'yes'] },
] as const

const faqs = [
  {
    q: 'Gibt es eine Provision pro Buchung?',
    a: 'Nein. Nur eine klare Abogebühr.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, monatlich kündbar.',
  },
  {
    q: 'Brauchen Kunden eine App oder Registrierung?',
    a: 'Nein. Kunden buchen ohne App und ohne Registrierung.',
  },
  {
    q: 'Kann ich BookingHub in meine Website einbetten?',
    a: 'Ja, per Link oder Embed.',
  },
  {
    q: 'Ist das DSGVO-konform?',
    a: 'DSGVO-ready, Daten werden sicher verarbeitet.',
  },
  {
    q: 'Kann ich später upgraden/downgraden?',
    a: 'Ja, jederzeit möglich.',
  },
] as const

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader />
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Preise, die fair bleiben
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-600">
              Keine Provision pro Buchung. Nur eine klare Abogebühr.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-gray-700">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              Keine Provision
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-gray-700">
              <Shield className="h-4 w-4 text-blue-600" />
              DSGVO
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-gray-700">
              <Zap className="h-4 w-4 text-amber-600" />
              In 10 Minuten startklar
            </span>
          </div>

          <div className="mt-10">
            <PricingPlans plans={plans} />
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              In allen Paketen enthalten
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Keine versteckten Einschränkungen in den Basisfunktionen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Pakete im Vergleich
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Alle Features auf einen Blick.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold">Starter</th>
                  <th className="px-6 py-4 font-semibold">Pro</th>
                  <th className="px-6 py-4 font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-gray-700">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="px-6 py-4">
                        {value === 'yes' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : value === 'no' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className="text-gray-700">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              FAQ
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Häufige Fragen, klar beantwortet.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer list-none text-gray-900 font-semibold flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-12 sm:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Bereit zu starten?
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 mb-10">
                Kostenlos starten oder die Live Demo ansehen.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold"
                >
                  Kostenlos starten
                </Link>
                <Link
                  href="/book/test-salon"
                  className="inline-flex items-center gap-2 text-white/90 px-8 py-4 rounded-xl font-semibold border border-white/20"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live Demo
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
