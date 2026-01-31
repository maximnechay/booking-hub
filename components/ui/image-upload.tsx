'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
    currentUrl: string | null | undefined
    onUploaded: (url: string | null) => void
    uploadType: 'logo' | 'cover' | 'avatar'
    label: string
    aspect?: 'square' | 'wide'
    uploadEndpoint?: string
    extraUploadData?: Record<string, string>
    extraDeleteData?: Record<string, string>
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function ImageUpload({
    currentUrl,
    onUploaded,
    uploadType,
    label,
    aspect = 'square',
    uploadEndpoint = '/api/settings/upload',
    extraUploadData,
    extraDeleteData,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Reset input so same file can be selected again
        e.target.value = ''

        if (!file.type.startsWith('image/')) {
            setError('Nur Bilddateien erlaubt')
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Maximal 5 MB')
            return
        }

        setError(null)
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', uploadType)
            if (extraUploadData) {
                Object.entries(extraUploadData).forEach(([key, value]) => {
                    formData.append(key, value)
                })
            }

            const res = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
            })

            const result = await res.json()

            if (!res.ok) {
                setError(result.error || 'Upload fehlgeschlagen')
                return
            }

            onUploaded(result.url)
        } catch {
            setError('Upload fehlgeschlagen')
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = async () => {
        setIsUploading(true)
        setError(null)

        try {
            const payload: Record<string, string> = { type: uploadType }
            if (extraDeleteData) {
                Object.assign(payload, extraDeleteData)
            }
            if (currentUrl) {
                payload.url = currentUrl
            }

            const res = await fetch(uploadEndpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const result = await res.json()
                setError(result.error || 'Löschen fehlgeschlagen')
                return
            }

            onUploaded(null)
        } catch {
            setError('Löschen fehlgeschlagen')
        } finally {
            setIsUploading(false)
        }
    }

    const isWide = aspect === 'wide'

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{label}</label>

            <div
                className={`relative group border-2 border-dashed border-gray-200 rounded-lg overflow-hidden transition-colors hover:border-gray-300 ${
                    isWide ? 'aspect-[3/1]' : 'w-32 h-32'
                }`}
            >
                {currentUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={currentUrl}
                            alt={label}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={isUploading}
                                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                                title="Ersetzen"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={isUploading}
                                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                title="Entfernen"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 cursor-pointer"
                    >
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-6 h-6 mb-1" />
                                <span className="text-xs">Bild hochladen</span>
                            </>
                        )}
                    </button>
                )}

                {/* Uploading overlay */}
                {isUploading && currentUrl && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}
        </div>
    )
}
