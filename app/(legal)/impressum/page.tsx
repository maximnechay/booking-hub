import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Impressum | BookingHub',
    description: 'Impressum und rechtliche Angaben zu BookingHub',
    robots: 'noindex, follow',
}

export default function ImpressumPage() {
    return (
        <div className="space-y-8 text-sm leading-7 text-gray-700">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">Impressum</h1>
                <p className="text-gray-500">
                    Rechtliche Angaben gemäß § 5 TMG.
                </p>
            </header>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Angaben gemäß § 5 TMG</h2>
                <div>
                    <p className="font-medium text-gray-900">BookingHub (Anthropic Placeholder)</p>
                    <p>Musterstraße 1</p>
                    <p>10115 Berlin</p>
                    <p>Deutschland</p>
                </div>
                <div>
                    <p>
                        <span className="font-medium text-gray-900">E-Mail:</span>{' '}
                        hello@bookinghub.example
                    </p>
                    <p>
                        <span className="font-medium text-gray-900">Telefon:</span>{' '}
                        +49 30 12345678
                    </p>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Vertreten durch</h2>
                <p>Max Mustermann, Geschäftsführer</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Registereintrag</h2>
                <p>Handelsregister: Amtsgericht Berlin (Charlottenburg)</p>
                <p>Registernummer: HRB 123456</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Umsatzsteuer-ID</h2>
                <p>USt-IdNr. gemäß §27a UStG: DE123456789</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
                </h2>
                <p>Max Mustermann</p>
                <p>Musterstraße 1, 10115 Berlin, Deutschland</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Streitschlichtung</h2>
                <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.
                    Sie finden diese unter folgendem Link:{' '}
                    <Link
                        href="https://ec.europa.eu/consumers/odr"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline"
                    >
                        EU-Streitschlichtungsplattform
                    </Link>
                    .
                </p>
                <p>
                    Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
                    Verbraucherschlichtungsstelle teilzunehmen.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Haftungsausschluss</h2>
                <p>
                    <span className="font-medium text-gray-900">Haftung für Inhalte:</span> Als Diensteanbieter sind wir
                    gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                    verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
                    übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
                    forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
                <p>
                    <span className="font-medium text-gray-900">Haftung für Links:</span> Unser Angebot enthält Links zu
                    externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir
                    für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
                    Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
            </section>

            <p className="text-xs text-gray-500">Letzte Aktualisierung: 29. Januar 2026</p>
        </div>
    )
}
