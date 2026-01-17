// lib/email/send-booking-confirmation.ts

import { sendEmail } from './client'
import BookingConfirmationEmail from './templates/booking-confirmation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface BookingData {
    clientName: string
    clientEmail: string
    salonName: string
    serviceName: string
    staffName: string
    startTime: Date
    duration: number      // минуты
    price: number         // центы
    salonAddress?: string
    salonPhone?: string
    cancelUrl?: string
}

export async function sendBookingConfirmation(booking: BookingData) {
    const formatPrice = (cents: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
            .format(cents / 100)

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Min.`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
    }

    const dateFormatted = format(booking.startTime, "EEEE, d. MMMM yyyy", { locale: de })
    const timeFormatted = format(booking.startTime, "HH:mm")

    return sendEmail({
        to: booking.clientEmail,
        subject: `Buchungsbestätigung - ${booking.salonName}`,
        react: BookingConfirmationEmail({
            clientName: booking.clientName,
            salonName: booking.salonName,
            serviceName: booking.serviceName,
            staffName: booking.staffName,
            date: dateFormatted,
            time: timeFormatted,
            duration: formatDuration(booking.duration),
            price: formatPrice(booking.price),
            salonAddress: booking.salonAddress,
            salonPhone: booking.salonPhone,
            cancelUrl: booking.cancelUrl,
        }),
    })
}