// lib/email/send-booking-reminder.ts

import { sendEmail } from './client'
import BookingReminderEmail from './templates/booking-reminder'

interface SendReminderParams {
    to: string
    clientName: string
    salonName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    duration: string
    salonAddress?: string
    salonPhone?: string
    cancelUrl?: string
}

export async function sendBookingReminder(params: SendReminderParams) {
    const { to, salonName, ...emailProps } = params

    return sendEmail({
        to,
        subject: `Erinnerung: Ihr Termin heute bei ${salonName}`,
        react: BookingReminderEmail({ ...emailProps, salonName }),
    })
}
