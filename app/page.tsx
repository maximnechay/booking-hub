import WidgetPreview from '@/components/bookinghub/widget-preview'

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
      <script
        src="http://localhost:3000/widget.js"
        data-bookinghub
        data-slug="kristina"
        data-mode="popup"
        data-button-text="Termin buchen"
        data-height="90vh">
      </script>

    </div>
  );
}
