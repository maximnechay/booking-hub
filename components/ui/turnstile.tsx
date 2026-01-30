'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileProps {
    onVerify: (token: string) => void
    onError?: () => void
    onExpire?: () => void
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: object) => string
            reset: (widgetId: string) => void
            remove: (widgetId: string) => void
        }
        onloadTurnstileCallback?: () => void
    }
}

export function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const callbacksRef = useRef({ onVerify, onError, onExpire })

    // Keep refs in sync without triggering effect re-runs
    callbacksRef.current = { onVerify, onError, onExpire }

    const handleVerify = useCallback((token: string) => {
        callbacksRef.current.onVerify(token)
    }, [])

    const handleError = useCallback(() => {
        callbacksRef.current.onError?.()
    }, [])

    const handleExpire = useCallback(() => {
        callbacksRef.current.onExpire?.()
    }, [])

    useEffect(() => {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
        if (!siteKey) return

        const renderWidget = () => {
            if (!containerRef.current || !window.turnstile) return
            if (widgetIdRef.current) return

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: handleVerify,
                'error-callback': handleError,
                'expired-callback': handleExpire,
                theme: 'light',
                language: 'de',
            })
        }

        if (!window.turnstile) {
            const script = document.createElement('script')
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
            script.async = true
            window.onloadTurnstileCallback = renderWidget
            document.head.appendChild(script)
        } else {
            renderWidget()
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }
        }
    }, [handleVerify, handleError, handleExpire])

    return <div ref={containerRef} className="my-4" />
}
