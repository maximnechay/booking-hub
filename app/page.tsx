// app/page.tsx

import WidgetPreview from '@/components/bookinghub/widget-preview'
import WidgetPopup from '@/components/bookinghub/widget-popup'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Widget Preview</h1>
          <p className="text-sm text-gray-500">Inline Einbettung auf der Startseite</p>
        </header>
        <WidgetPreview slug="kristina" />
      </main>

      <WidgetPopup slug="kristina" buttonText="Termin buchen" />
    </div>
  )
}