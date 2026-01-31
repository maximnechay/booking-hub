// lib/email/send-admin-cancellation.ts

import { sendEmail } from './client'
import AdminCancellationNotificationEmail from './templates/admin-cancellation-notification'

interface SendAdminCancellationParams {
    to: string
    salonName: string
    clientName: string
    clientPhone: string
    clientEmail: string | null
    serviceName: string
    staffName: string
    date: string
    time: string
}

export async function sendAdminCancellationNotification(params: SendAdminCancellationParams) {
    const { to, serviceName, date, time, ...emailProps } = params

    return sendEmail({
        to,
        subject: `Stornierung: ${serviceName} am ${date}`,
        react: AdminCancellationNotificationEmail({
            ...emailProps,
            serviceName,
            date,
            time,
        }),
    })
}
