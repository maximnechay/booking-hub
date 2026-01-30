// lib/email/send-admin-notification.ts

import { sendEmail } from './client'
import AdminBookingNotificationEmail from './templates/admin-booking-notification'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface AdminNotificationData {
    ownerEmail: string
    salonName: string
    clientName: string
    clientPhone: string
    clientEmail: string | null
    serviceName: string
    staffName: string
    startTime: Date
    duration: number
    price: number
}

export async function sendAdminBookingNotification(data: AdminNotificationData) {
    const formatPrice = (cents: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
            .format(cents / 100)

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Min.`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
    }

    const dateFormatted = format(data.startTime, "EEEE, d. MMMM yyyy", { locale: de })
    const timeFormatted = format(data.startTime, "HH:mm")

    return sendEmail({
        to: data.ownerEmail,
        subject: `Neue Buchung: ${data.serviceName} am ${dateFormatted}`,
        react: AdminBookingNotificationEmail({
            salonName: data.salonName,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            clientEmail: data.clientEmail,
            serviceName: data.serviceName,
            staffName: data.staffName,
            date: dateFormatted,
            time: timeFormatted,
            duration: formatDuration(data.duration),
            price: formatPrice(data.price),
        }),
    })
}
