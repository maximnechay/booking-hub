// lib/email/send-admin-reschedule.ts

import { sendEmail } from './client'
import AdminRescheduleNotificationEmail from './templates/admin-reschedule-notification'

interface SendAdminRescheduleParams {
    to: string
    salonName: string
    clientName: string
    clientPhone: string
    clientEmail: string | null
    serviceName: string
    staffName: string
    oldDate: string
    oldTime: string
    newDate: string
    newTime: string
}

export async function sendAdminRescheduleNotification(params: SendAdminRescheduleParams) {
    const { to, serviceName, clientName, ...emailProps } = params

    return sendEmail({
        to,
        subject: `Termin verschoben: ${serviceName} — ${clientName}`,
        react: AdminRescheduleNotificationEmail({
            ...emailProps,
            serviceName,
            clientName,
        }),
    })
}
