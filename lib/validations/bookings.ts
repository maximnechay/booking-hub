import { z } from 'zod'

export const createBookingSchema = z.object({
    client_name: z.string().min(2).max(100),
    client_phone: z.string().min(5).max(50),
    client_email: z.string().email().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    service_id: z.string().uuid(),
    staff_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    duration: z.number().int().min(5).max(480),
    price: z.number().int().min(0),
})
