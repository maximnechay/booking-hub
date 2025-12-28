// lib/email/client.ts

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set - emails will be logged only')
}

export const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

export type EmailResult = {
    success: boolean
    id?: string
    error?: string
}

export async function sendEmail({
    to,
    subject,
    react,
}: {
    to: string
    subject: string
    react: React.ReactElement
}): Promise<EmailResult> {
    // Если нет API key — логируем и возвращаем успех (для разработки)
    if (!resend) {
        console.log('📧 [DEV] Email would be sent:', { to, subject })
        return { success: true, id: 'dev-mode' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'BookingHub <noreply@resend.dev>',
            to,
            subject,
            react,
        })

        if (error) {
            console.error('Email send error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('Email send exception:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}