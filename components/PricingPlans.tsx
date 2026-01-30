'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type Plan = {
  name: string
  priceMonthly: number
  description: string
  badge: string | null
  features: readonly string[]
  cta: { label: string; href: string }
}

type Billing = 'monthly' | 'yearly'

const discount = 0.2

const formatPrice = (price: number) => `${price}€`

export default function PricingPlans({ plans }: { plans: readonly Plan[] }) {
  const [billing, setBilling] = useState<Billing>('monthly')

  const prices = useMemo(() => {
    return plans.map((plan) => {
      const yearlyMonthly = Math.round(plan.priceMonthly * (1 - discount))
      return {
        ...plan,
        displayPrice: billing === 'monthly' ? plan.priceMonthly : yearlyMonthly,
      }
    })
  }, [billing, plans])

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 p-1 text-sm">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              billing === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-600'
            }`}
          >
            Monatlich
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              billing === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-600'
            }`}
          >
            Jährlich
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Jederzeit kündbar
          {billing === 'yearly' ? ' • 20% sparen bei jährlicher Zahlung' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prices.map((plan) => {
          const isPro = plan.name === 'Pro'
          return (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 shadow-sm ${
                isPro
                  ? 'border-indigo-300 bg-gradient-to-b from-indigo-50 to-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.badge && (
                <div className="absolute right-6 top-6 rounded-full bg-gray-900 text-white px-3 py-1 text-xs font-semibold">
                  {plan.badge}
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(plan.displayPrice)}
                </span>
                <span className="text-sm text-gray-500">/Monat</span>
              </div>
              {billing === 'yearly' && (
                <div className="mt-1 text-xs text-gray-500">bei jährlicher Zahlung</div>
              )}

              <ul className="mt-6 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-8 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  isPro ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'
                }`}
              >
                {plan.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
        <span>Keine Provision pro Buchung</span>
        <span>Jederzeit kündbar</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/book/test-salon"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold"
          target="_blank"
          rel="noopener noreferrer"
        >
          Live Demo ansehen
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-200 bg-white hover:bg-gray-50"
        >
          Kostenlos starten
        </Link>
      </div>
    </div>
  )
}
