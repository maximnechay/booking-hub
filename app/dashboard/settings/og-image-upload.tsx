'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react'

interface OgImageUploadProps {
    currentImage: string | null
    onUpdate: () => void
}

export default function OgImageUpload({ currentImage, onUpdate }: OgImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImage)

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setPreview(URL.createObjectURL(file))
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/tenant/og-image', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || 'Upload fehlgeschlagen')
                setPreview(currentImage)
                return
            }

            setPreview(data.og_image_url)
            onUpdate()
        } catch {
            alert('Upload fehlgeschlagen')
            setPreview(currentImage)
        } finally {
            setIsUploading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Social Media Bild wirklich löschen?')) return

        setIsDeleting(true)
        try {
            const res = await fetch('/api/tenant/og-image', { method: 'DELETE' })

            if (res.ok) {
                setPreview(null)
                onUpdate()
            }
        } catch {
            alert('Löschen fehlgeschlagen')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-medium text-gray-900">Social Media Vorschaubild</h3>
                <p className="text-sm text-gray-500">
                    Wird angezeigt wenn jemand Ihren Buchungslink teilt (z.B. WhatsApp, Telegram, Facebook)
                </p>
            </div>

            {preview ? (
                <div className="relative max-w-md">
                    <img
                        src={preview}
                        alt="OG Preview"
                        className="w-full rounded-lg border border-gray-200"
                        style={{ aspectRatio: '1200/630' }}
                    />
                    <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center max-w-md">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">
                        Kein Bild hochgeladen. Es wird automatisch eins mit Ihrem Salonnamen generiert.
                    </p>
                </div>
            )}

            <div>
                <label className="cursor-pointer inline-block">
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <Button variant="outline" disabled={isUploading} asChild>
                        <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Lädt hoch...' : 'Bild hochladen'}
                        </span>
                    </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                    Empfohlen: 1200 × 630 px, PNG oder JPG, max. 2 MB
                </p>
            </div>
        </div>
    )
}
