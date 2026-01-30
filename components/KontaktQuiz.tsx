'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type BusinessType = 'Einzelmeister' | 'Salon' | 'Studio-Kette' | 'Unsicher'
type MainPain =
  | 'Zu viel Hin-und-her mit Kunden'
  | 'Viele No-Shows'
  | 'Chaos im Kalender'
  | 'Zu wenig Zeit für Kunden'
  | 'Einfach alles manuell'
type TeamSize = 'Nur ich' | '2–3' | '4–10' | 'Mehr als 10'
type MonthlyBookings = 'Bis 50' | '50–100' | '100–300' | 'Mehr als 300'

type FormState = {
  businessType?: BusinessType
  currentBooking: string[]
  mainPain?: MainPain
  teamSize?: TeamSize
  monthlyBookings?: MonthlyBookings
  name: string
  email: string
  phone: string
  wantsDemo: boolean
}

const steps = [
  'Business',
  'Aktuelle Buchung',
  'Hauptproblem',
  'Teamgröße',
  'Monatliche Termine',
  'Kontakt',
] as const

const badges = ['Kostenlos', 'Unverbindlich', 'Kein Verkaufsgespräch'] as const

const bookingOptions = [
  'WhatsApp / Telefon',
  'Instagram Nachrichten',
  'Online-Buchung (anderes Tool)',
  'Gar kein System',
] as const

const recommendationText = {
  starter: 'Für Ihr Business ist der Starter oder Pro Plan ideal.',
  pro: 'Wir empfehlen Pro – weniger No-Shows, mehr Übersicht.',
  business: 'Für Ihr Setup ist Business sinnvoll. Lassen Sie uns kurz sprechen.',
} as const

const determineRecommendation = (state: FormState) => {
  if (state.businessType === 'Studio-Kette' || state.monthlyBookings === 'Mehr als 300') {
    return 'business' as const
  }
  if (state.businessType === 'Salon' && state.monthlyBookings === '100–300') {
    return 'pro' as const
  }
  if (
    state.businessType === 'Einzelmeister' &&
    (state.monthlyBookings === 'Bis 50' || state.monthlyBookings === '50–100')
  ) {
    return 'starter' as const
  }
  return 'pro' as const
}

export default function KontaktQuiz() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [state, setState] = useState<FormState>({
    currentBooking: [],
    name: '',
    email: '',
    phone: '',
    wantsDemo: false,
  })

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step])
  const recommendation = useMemo(() => determineRecommendation(state), [state])

  const handleNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1))
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0))

  const toggleBookingOption = (value: string) => {
    setState((prev) => {
      const exists = prev.currentBooking.includes(value)
      const updated = exists
        ? prev.currentBooking.filter((item) => item !== value)
        : [...prev.currentBooking, value]
      return { ...prev, currentBooking: updated }
    })
  }

  const submitLead = async () => {
    setError(null)
    if (!state.name || !state.email) {
      setError('Bitte füllen Sie Name und E-Mail aus.')
      return
    }
    if (!privacyAccepted) {
      setError('Bitte stimmen Sie der Datenschutzerklärung zu.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...state,
        recommendedPlan: recommendation,
        submittedAt: new Date().toISOString(),
      }

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      setIsSubmitted(true)
    } catch {
      setError('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Lassen Sie uns schauen, ob BookingHub zu Ihnen passt
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600">
            Beantworten Sie ein paar Fragen – dauert weniger als 1 Minute.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full bg-white border border-gray-200 px-4 py-2 text-gray-700"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Schritt {step + 1} von {steps.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-gray-900" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {!isSubmitted ? (
              <>
                {step === 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Was beschreibt Ihr Business am besten?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Einzelmeister', 'Salon', 'Studio-Kette', 'Ich bin mir nicht sicher'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              businessType: option === 'Ich bin mir nicht sicher' ? 'Unsicher' : (option as BusinessType),
                            }))
                            handleNext()
                          }}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left font-semibold text-gray-800 hover:border-gray-300 hover:shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Wie werden Termine aktuell gebucht?</h2>
                    <p className="text-sm text-gray-500 mb-4">Mehrfachauswahl möglich</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bookingOptions.map((option) => {
                        const selected = state.currentBooking.includes(option)
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleBookingOption(option)}
                            className={`rounded-2xl border px-4 py-4 text-left font-semibold transition ${
                              selected
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Zurück
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-semibold"
                      >
                        Weiter
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Was ist aktuell Ihr größtes Problem?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        'Zu viel Hin-und-her mit Kunden',
                        'Viele No-Shows',
                        'Chaos im Kalender',
                        'Zu wenig Zeit für Kunden',
                        'Einfach alles manuell',
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setState((prev) => ({ ...prev, mainPain: option as MainPain }))
                            handleNext()
                          }}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left font-semibold text-gray-800 hover:border-gray-300 hover:shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="mt-6 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Zurück
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Wie viele Mitarbeiter arbeiten mit Terminen?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Nur ich', '2–3', '4–10', 'Mehr als 10'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setState((prev) => ({ ...prev, teamSize: option as TeamSize }))
                            handleNext()
                          }}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left font-semibold text-gray-800 hover:border-gray-300 hover:shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="mt-6 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Zurück
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Wie viele Termine haben Sie ungefähr pro Monat?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Bis 50', '50–100', '100–300', 'Mehr als 300'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setState((prev) => ({ ...prev, monthlyBookings: option as MonthlyBookings }))
                            handleNext()
                          }}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left font-semibold text-gray-800 hover:border-gray-300 hover:shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="mt-6 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Zurück
                    </button>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Fast fertig</h2>
                    <p className="text-sm text-gray-500 mb-6">Wir melden uns mit einer passenden Empfehlung.</p>

                    {error && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm text-gray-600">Name *</label>
                        <input
                          value={state.name}
                          onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="Ihr Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">E-Mail *</label>
                        <input
                          type="email"
                          value={state.email}
                          onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="name@email.de"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Telefon (optional)</label>
                        <input
                          value={state.phone}
                          onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="+49 ..."
                        />
                      </div>
                    </div>

                    <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={state.wantsDemo}
                        onChange={(e) => setState((prev) => ({ ...prev, wantsDemo: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Ich möchte eine kurze Demo sehen
                    </label>

                    <label className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <span>
                        Ich habe die{' '}
                        <Link href="/datenschutz" className="text-blue-600 hover:underline">
                          Datenschutzerklärung
                        </Link>{' '}
                        gelesen und akzeptiere sie.
                      </span>
                    </label>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Zurück
                      </button>
                      <button
                        type="button"
                        onClick={submitLead}
                        disabled={isSubmitting}
                        className="rounded-xl bg-gray-900 text-white px-6 py-3 text-sm font-semibold"
                      >
                        {isSubmitting ? 'Wird gesendet...' : 'Empfehlung erhalten'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Danke für Ihre Anfrage</h2>
                <p className="text-gray-600 mb-6">{recommendationText[recommendation]}</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {recommendation === 'business' ? (
                    <Link
                      href="/kontakt"
                      className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white px-6 py-3 text-sm font-semibold"
                    >
                      Beratung anfragen
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white px-6 py-3 text-sm font-semibold"
                    >
                      Kostenlos starten
                    </Link>
                  )}
                  <Link
                    href="/book/test-salon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700"
                  >
                    Live Demo ansehen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
