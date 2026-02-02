// lib/email/send-booking-rescheduled.ts

import { sendEmail } from './client'
import BookingRescheduledEmail from './templates/booking-rescheduled'

interface SendBookingRescheduledParams {
    to: string
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    oldDate: string
    oldTime: string
    newDate: string
    newTime: string
    duration: string
    salonAddress?: string
    salonPhone?: string
    cancelUrl?: string
}

export async function sendBookingRescheduled(params: SendBookingRescheduledParams) {
    const { to, serviceName, newDate, newTime, ...emailProps } = params

    return sendEmail({
        to,
        subject: `Termin verschoben: ${serviceName} am ${newDate}`,
        react: BookingRescheduledEmail({
            ...emailProps,
            serviceName,
            newDate,
            newTime,
        }),
    })
}
