'use client'

import Link from 'next/link'
import { Calendar, Users, Zap, Shield, ArrowRight, Play } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [selectedService, setSelectedService] = useState(0)

  const services = [
    { name: 'Haarschnitt', duration: '30 Min', price: '35€' },
    { name: 'Färben', duration: '90 Min', price: '85€' },
    { name: 'Styling', duration: '45 Min', price: '45€' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '20px', color: '#111827' }}>BookingHub</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/login" style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563', padding: '8px 16px', textDecoration: 'none' }}>
              Anmelden
            </Link>
            <Link href="/register" style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              background: '#111827',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none'
            }}>
              Starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '128px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '64px', alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '24px'
              }}>
                <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>
                Über 500 aktive Nutzer
              </div>

              <h1 style={{ fontSize: '60px', fontWeight: 700, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Termine online
                <br />
                <span style={{
                  background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  automatisch
                </span>
                <br />
                verwalten
              </h1>

              <p style={{ marginTop: '24px', fontSize: '20px', color: '#4b5563', lineHeight: 1.6, maxWidth: '480px' }}>
                Das Buchungssystem, das Ihre Kunden lieben werden.
                Einfach einbetten, sofort loslegen.
              </p>

              <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#111827',
                    color: 'white',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                >
                  Kostenlos starten
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </Link>
                <Link
                  href="/book/kristina"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#374151',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: '1px solid #e5e7eb',
                    background: 'white'
                  }}
                >
                  <Play style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                  Live Demo
                </Link>
              </div>

              <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${['#60a5fa', '#a78bfa', '#fb923c', '#34d399'][i-1]} 0%, ${['#3b82f6', '#8b5cf6', '#f97316', '#10b981'][i-1]} 100%)`,
                      border: '2px solid white',
                      marginLeft: i > 1 ? '-8px' : '0'
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>4.9/5 Bewertung</div>
                  <div style={{ color: '#6b7280' }}>von 200+ Kunden</div>
                </div>
              </div>
            </div>

            {/* Right - Widget */}
            <div style={{ position: 'relative' }}>
              {/* Glow */}
              <div style={{
                position: 'absolute',
                inset: '-16px',
                background: 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(79,70,229,0.2) 50%, rgba(124,58,237,0.2) 100%)',
                borderRadius: '24px',
                filter: 'blur(40px)'
              }}></div>

              {/* Card */}
              <div style={{
                position: 'relative',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                border: '1px solid #f3f4f6',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(90deg, #111827 0%, #1f2937 100%)',
                  padding: '24px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 700
                    }}>
                      K
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '18px' }}>Kristina Studio</h3>
                      <p style={{ color: '#9ca3af', fontSize: '14px' }}>Friseursalon • Berlin</p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div style={{ padding: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', marginBottom: '16px' }}>Service wählen</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {services.map((service, i) => (
                      <button
                        key={service.name}
                        onClick={() => setSelectedService(i)}
                        style={{
                          width: '100%',
                          padding: '16px',
                          borderRadius: '12px',
                          border: selectedService === i ? '2px solid #3b82f6' : '2px solid #f3f4f6',
                          background: selectedService === i ? '#eff6ff' : 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: selectedService === i ? 'none' : '2px solid #d1d5db',
                              background: selectedService === i ? '#3b82f6' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {selectedService === i && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: '#111827' }}>{service.name}</p>
                              <p style={{ fontSize: '14px', color: '#6b7280' }}>{service.duration}</p>
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{service.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button style={{
                    width: '100%',
                    marginTop: '24px',
                    background: '#2563eb',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    Weiter zur Terminauswahl
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#111827' }}>
              Alles was Sie brauchen
            </h2>
            <p style={{ marginTop: '16px', fontSize: '20px', color: '#6b7280' }}>
              Professionelle Features, einfach zu bedienen
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { icon: Calendar, title: '24/7 Buchungen', desc: 'Kunden buchen jederzeit', color: '#3b82f6', bg: '#eff6ff' },
              { icon: Users, title: 'Team verwalten', desc: 'Mehrere Mitarbeiter', color: '#8b5cf6', bg: '#f5f3ff' },
              { icon: Zap, title: 'Sofort startklar', desc: '5 Minuten Setup', color: '#f59e0b', bg: '#fffbeb' },
              { icon: Shield, title: 'DSGVO-konform', desc: 'Sichere Daten', color: '#10b981', bg: '#ecfdf5' },
            ].map((f) => (
              <div key={f.title} style={{
                padding: '24px',
                borderRadius: '16px',
                background: '#f9fafb',
                border: '1px solid transparent',
                transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: f.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <f.icon style={{ width: '24px', height: '24px', color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            padding: '64px'
          }}>
            {/* Decorations */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '256px',
              height: '256px',
              background: 'rgba(59,130,246,0.1)',
              borderRadius: '50%',
              filter: 'blur(60px)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '256px',
              height: '256px',
              background: 'rgba(124,58,237,0.1)',
              borderRadius: '50%',
              filter: 'blur(60px)'
            }}></div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
                Bereit für mehr Buchungen?
              </h2>
              <p style={{ fontSize: '20px', color: '#9ca3af', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
                Starten Sie kostenlos und erleben Sie, wie einfach Online-Terminbuchung sein kann.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    color: '#111827',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Jetzt kostenlos starten
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </Link>
                <Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none', fontWeight: 500 }}>
                  Oder anmelden →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>
            <span style={{ fontWeight: 600, color: '#111827' }}>BookingHub</span>
            <span style={{ color: '#9ca3af' }}>© {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/login" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Anmelden</Link>
            <Link href="/register" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Registrieren</Link>
            <Link href="/dashboard" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
