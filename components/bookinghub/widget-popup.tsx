// components/bookinghub/widget-popup.tsx

'use client'

import { useEffect } from 'react'

interface WidgetPopupProps {
    slug: string
    buttonText?: string
    height?: string
}

export default function WidgetPopup({
    slug,
    buttonText = 'Termin buchen',
    height = '90vh'
}: WidgetPopupProps) {
    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

        const script = document.createElement('script')
        script.src = `${baseUrl}/widget.js`
        script.setAttribute('data-bookinghub', '')
        script.setAttribute('data-slug', slug)
        script.setAttribute('data-mode', 'popup')
        script.setAttribute('data-button-text', buttonText)
        script.setAttribute('data-height', height)

        document.body.appendChild(script)

        return () => {
            script.remove()
            // Удаляем кнопку и overlay если есть
            document.querySelector('.bookinghub-popup-button')?.remove()
            document.querySelector('.bookinghub-popup-overlay')?.remove()
        }
    }, [slug, buttonText, height])

    return null
}