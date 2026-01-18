// components/bookinghub/widget-preview.tsx

'use client'

import { useEffect, useRef } from 'react'

type WidgetPreviewProps = {
    slug: string
    height?: string
}

export default function WidgetPreview({ slug, height = '900px' }: WidgetPreviewProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        const script = document.createElement('script')
        script.src = `${baseUrl}/widget.js`
        script.async = true
        script.dataset.bookinghub = ''
        script.dataset.slug = slug
        script.dataset.mode = 'inline'
        script.dataset.target = '#bookinghub-widget'
        script.dataset.height = height
        if (baseUrl) {
            script.dataset.baseUrl = baseUrl
        }

        document.body.appendChild(script)

        return () => {
            script.remove()
            container.innerHTML = ''
        }
    }, [slug, height])

    return (
        <div
            id="bookinghub-widget"
            ref={containerRef}
            className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm"
        />
    )
}
