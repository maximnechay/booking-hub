// lib/email/send-booking-cancellation.ts

import { sendEmail } from './client'
import BookingCancellationEmail from './templates/booking-cancellation'

interface SendCancellationParams {
    to: string
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    bookingUrl?: string
}

export async function sendBookingCancellation(params: SendCancellationParams) {
    const { to, salonName, ...emailProps } = params

    return sendEmail({
        to,
        subject: `Stornierungsbestätigung - ${salonName}`,
        react: BookingCancellationEmail({ ...emailProps, salonName }),
    })
}
