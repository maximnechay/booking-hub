import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Datenschutzerklärung | BookingHub',
    description: 'Informationen zum Datenschutz bei BookingHub',
    robots: 'noindex, follow',
}

export default function DatenschutzPage() {
    return (
        <div className="space-y-10 text-sm leading-7 text-gray-700">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">Datenschutzerklärung</h1>
                <p className="text-gray-500">
                    Informationen gemäß DSGVO über die Verarbeitung personenbezogener Daten.
                </p>
            </header>

            <nav aria-label="Inhaltsverzeichnis" className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <h2 className="text-sm font-semibold text-gray-900">Inhaltsverzeichnis</h2>
                <ul className="mt-3 space-y-1 text-sm">
                    <li><Link href="#einleitung" className="hover:underline">1. Einleitung und Überblick</Link></li>
                    <li><Link href="#erhebung" className="hover:underline">2. Erhebung und Speicherung personenbezogener Daten</Link></li>
                    <li><Link href="#weitergabe" className="hover:underline">3. Weitergabe von Daten</Link></li>
                    <li><Link href="#cookies" className="hover:underline">4. Cookies und Tracking</Link></li>
                    <li><Link href="#speicherdauer" className="hover:underline">5. Speicherdauer</Link></li>
                    <li><Link href="#rechte" className="hover:underline">6. Ihre Rechte (Art. 15-21 DSGVO)</Link></li>
                    <li><Link href="#sicherheit" className="hover:underline">7. Datensicherheit</Link></li>
                    <li><Link href="#auftragsverarbeitung" className="hover:underline">8. Auftragsverarbeitung</Link></li>
                    <li><Link href="#aenderungen" className="hover:underline">9. Änderungen dieser Datenschutzerklärung</Link></li>
                </ul>
            </nav>

            <section id="einleitung" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">1. Einleitung und Überblick</h2>
                <p>
                    Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist:
                </p>
                <div>
                    <p className="font-medium text-gray-900">BookingHub (Anthropic Placeholder)</p>
                    <p>Musterstraße 1, 10115 Berlin, Deutschland</p>
                    <p>E-Mail: privacy@bookinghub.example</p>
                    <p>Telefon: +49 30 12345678</p>
                </div>
            </section>

            <section id="erhebung" className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">2. Erhebung und Speicherung personenbezogener Daten</h2>

                <div className="space-y-2">
                    <h3 className="text-base font-semibold text-gray-900">2.1 Beim Besuch der Website</h3>
                    <p>
                        Beim Aufrufen unserer Website werden automatisch Informationen allgemeiner Natur erfasst.
                        Dazu gehören z. B. IP-Adresse, Browsertyp, Betriebssystem, Referrer-URL sowie Datum und Uhrzeit
                        des Zugriffs.
                    </p>
                    <p>
                        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der sicheren und
                        stabilen Bereitstellung der Website).
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-base font-semibold text-gray-900">2.2 Bei Nutzung des Buchungssystems</h3>
                    <p>
                        Wenn Sie einen Termin buchen, verarbeiten wir die von Ihnen eingegebenen Daten wie Name,
                        Telefonnummer und E-Mail-Adresse, um die Buchung auszuführen und Sie zu kontaktieren.
                    </p>
                    <p>
                        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
                    </p>
                </div>
            </section>

            <section id="weitergabe" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">3. Weitergabe von Daten</h2>
                <p>
                    Wir geben personenbezogene Daten nur weiter, soweit dies zur Erfüllung des Vertrags erforderlich
                    ist oder eine gesetzliche Pflicht besteht.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Weitergabe an den gebuchten Salon (Auftragsverarbeitung).</li>
                    <li>
                        Technische Dienstleister:
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Vercel (Hosting) — USA, EU-Standardvertragsklauseln.</li>
                            <li>Supabase (Datenbank) — EU (Frankfurt).</li>
                            <li>Resend (E-Mail) — USA, EU-Standardvertragsklauseln.</li>
                            <li>Upstash (Redis) — EU.</li>
                            <li>Cloudflare (Turnstile) — falls implementiert.</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <section id="cookies" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">4. Cookies und Tracking</h2>
                <p>
                    Wir verwenden aktuell nur technisch notwendige Cookies, die für den Betrieb der Website erforderlich
                    sind. Es werden keine Analyse- oder Marketing-Tools eingesetzt, sofern keine ausdrückliche Einwilligung
                    vorliegt.
                </p>
            </section>

            <section id="speicherdauer" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">5. Speicherdauer</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Buchungsdaten: 2 Jahre nach dem Termin.</li>
                    <li>Logs: 90 Tage.</li>
                </ul>
                <p>Nach Ablauf der Fristen erfolgt eine automatische Löschung.</p>
            </section>

            <section id="rechte" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">6. Ihre Rechte (Art. 15-21 DSGVO)</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Auskunftsrecht</li>
                    <li>Berichtigungsrecht</li>
                    <li>Löschungsrecht ("Recht auf Vergessenwerden")</li>
                    <li>Einschränkung der Verarbeitung</li>
                    <li>Datenübertragbarkeit</li>
                    <li>Widerspruchsrecht</li>
                    <li>Beschwerderecht bei der zuständigen Aufsichtsbehörde</li>
                </ul>
            </section>

            <section id="sicherheit" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">7. Datensicherheit</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>SSL/TLS-Verschlüsselung.</li>
                    <li>Zugriffsbeschränkungen nach dem Need-to-know-Prinzip.</li>
                    <li>Regelmäßige Backups.</li>
                </ul>
            </section>

            <section id="auftragsverarbeitung" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">8. Auftragsverarbeitung</h2>
                <p>
                    BookingHub agiert als Auftragsverarbeiter. Die Salons sind Verantwortliche für die
                    Verarbeitung ihrer Kundendaten. Ein Auftragsverarbeitungsvertrag (AVV) ist verfügbar.
                </p>
            </section>

            <section id="aenderungen" className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">9. Änderungen dieser Datenschutzerklärung</h2>
                <p>
                    Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie stets an die aktuellen
                    rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen umzusetzen.
                </p>
                <p className="text-xs text-gray-500">Stand: Januar 2025</p>
            </section>
        </div>
    )
}
