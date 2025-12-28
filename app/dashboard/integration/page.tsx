// app/dashboard/integration/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Plus, Trash2, ExternalLink } from 'lucide-react'

interface Tenant {
    slug: string
    name: string
}

interface Domain {
    id: string
    domain: string
    created_at: string
}

export default function IntegrationPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [domains, setDomains] = useState<Domain[]>([])
    const [newDomain, setNewDomain] = useState('')
    const [copied, setCopied] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        loadData()
    }, [])

    async function loadData() {
        try {
            // Загружаем tenant
            const tenantRes = await fetch('/api/settings/tenant')
            const tenantData = await tenantRes.json()
            if (tenantData.tenant) {
                setTenant(tenantData.tenant)
            }

            // Загружаем domains
            const domainsRes = await fetch('/api/domains')
            const domainsData = await domainsRes.json()
            if (domainsData.domains) {
                setDomains(domainsData.domains)
            }
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }

    const handleCopy = () => {
        if (!tenant) return
        const embedCode = getEmbedCode()
        navigator.clipboard.writeText(embedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain.trim() }),
            })

            if (!response.ok) {
                const result = await response.json()
                setError(result.error || 'Fehler beim Hinzufügen')
                return
            }

            setNewDomain('')
            loadData()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteDomain = async (id: string) => {
        if (!confirm('Domain wirklich entfernen?')) return

        try {
            const response = await fetch(`/api/domains/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                loadData()
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const [embedMode, setEmbedMode] = useState<'inline' | 'popup'>('inline')

    const getEmbedCode = () => {
        if (!tenant || !mounted) return ''  // ← ИЗМЕНЕНО
        const baseUrl = window.location.origin  // ← ИЗМЕНЕНО

        if (embedMode === 'popup') {
            return `<script 
  src="${baseUrl}/widget.js" 
  data-bookinghub 
  data-slug="${tenant.slug}"
  data-mode="popup"
  data-button-text="Termin buchen"
  data-height="90vh">
</script>`
        }

        return `<script 
  src="${baseUrl}/widget.js" 
  data-bookinghub 
  data-slug="${tenant.slug}"
  data-mode="inline"
  data-height="900px">
</script>`
    }

    const getWidgetUrl = () => {
        if (!tenant || !mounted) return ''
        return `${window.location.origin}/book/${tenant.slug}`
    }

    if (!tenant) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Lädt...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Integration</h1>

            {/* Embed Code */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Embed Code</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Fügen Sie diesen Code in Ihre Website ein
                    </p>
                </div>
                <div className="p-6">
                    {/* Mode Selector */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setEmbedMode('inline')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${embedMode === 'inline'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📄 Inline Mode
                        </button>
                        <button
                            onClick={() => setEmbedMode('popup')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${embedMode === 'popup'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🎯 Popup Mode
                        </button>
                    </div>

                    {/* Mode Description */}
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                        {embedMode === 'inline' ? (
                            <>
                                <strong>Inline Mode:</strong> Das Widget wird direkt an der Stelle im Seiteninhalt eingebettet, wo der Code eingefügt wird.
                            </>
                        ) : (
                            <>
                                <strong>Popup Mode:</strong> Ein floating Button rechts unten öffnet das Widget in einem schönen Modal-Fenster.
                            </>
                        )}
                    </div>

                    <div className="relative">
                        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-x-auto">
                            <code>{getEmbedCode()}</code>
                        </pre>
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Kopiert!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Kopieren
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium mb-2">
                            📖 Anleitung
                        </p>
                        {embedMode === 'inline' ? (
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Kopieren Sie den Code oben</li>
                                <li>Fügen Sie ihn in Ihre HTML-Datei ein (z.B. vor dem schließenden &lt;/body&gt; Tag)</li>
                                <li>Das Widget erscheint direkt an der Stelle, wo Sie den Code eingefügt haben</li>
                                <li>Optional: Passen Sie <code className="bg-blue-100 px-1 rounded">data-height</code> an (z.B. "800px", "90vh")</li>
                            </ol>
                        ) : (
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Kopieren Sie den Code oben</li>
                                <li>Fügen Sie ihn in Ihre HTML-Datei ein (z.B. vor dem schließenden &lt;/body&gt; Tag)</li>
                                <li>Ein Button "Termin buchen" erscheint rechts unten auf Ihrer Seite</li>
                                <li>Optional: Ändern Sie <code className="bg-blue-100 px-1 rounded">data-button-text</code> für eigenen Text</li>
                            </ol>
                        )}
                    </div>
                </div>
            </div>

            {/* Direct Link */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Direkter Link</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Teilen Sie diesen Link mit Ihren Kunden
                    </p>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <Input
                            value={getWidgetUrl()}
                            readOnly
                            className="font-mono text-sm"
                        />
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(getWidgetUrl())
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                            }}
                            variant="outline"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <a
                            href={getWidgetUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Erweiterte Optionen</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Anpassung des Widget-Verhaltens
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Verfügbare Attribute:</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <code className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-xs whitespace-nowrap">
                                    data-mode
                                </code>
                                <div>
                                    <p className="text-gray-900 font-medium">Mode</p>
                                    <p className="text-gray-600">"inline" oder "popup"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <code className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-xs whitespace-nowrap">
                                    data-height
                                </code>
                                <div>
                                    <p className="text-gray-900 font-medium">Höhe</p>
                                    <p className="text-gray-600">z.B. "900px", "80vh", "100%"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <code className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-xs whitespace-nowrap">
                                    data-button-text
                                </code>
                                <div>
                                    <p className="text-gray-900 font-medium">Button Text (nur popup)</p>
                                    <p className="text-gray-600">z.B. "Jetzt buchen", "Termin vereinbaren"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <code className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-xs whitespace-nowrap">
                                    data-target
                                </code>
                                <div>
                                    <p className="text-gray-900 font-medium">Target Element (nur inline)</p>
                                    <p className="text-gray-600">CSS-Selektor, z.B. "#booking-container"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Beispiel mit Custom Options:</h3>
                        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                            <code>{mounted ? `<script 
  src="${window.location.origin}/widget.js" 
  data-bookinghub 
  data-slug="${tenant?.slug || 'your-salon'}"
  data-mode="popup"
  data-button-text="Jetzt Termin buchen"
  data-height="85vh">
</script>` : 'Lädt...'}</code>
                        </pre>
                    </div>
                </div>
            </div>

            {/* Domain Whitelist */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Erlaubte Domains</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Nur diese Domains dürfen das Widget einbetten
                    </p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleAddDomain} className="mb-6">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="beispiel.de"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Ohne https:// oder www. (z.B. "beispiel.de")
                                </p>
                            </div>
                            <Button type="submit" disabled={isLoading || !newDomain.trim()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Hinzufügen
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}
                    </form>

                    {domains.length > 0 ? (
                        <div className="border rounded-lg divide-y">
                            {domains.map((domain) => (
                                <div
                                    key={domain.id}
                                    className="px-4 py-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{domain.domain}</p>
                                        <p className="text-xs text-gray-500">
                                            Hinzugefügt am {new Date(domain.created_at).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteDomain(domain.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="mb-2">Noch keine Domains hinzugefügt</p>
                            <p className="text-sm">
                                Fügen Sie die Domain Ihrer Website hinzu, um das Widget zu aktivieren
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}