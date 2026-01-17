// lib/validations/services.ts

import { z } from 'zod'

export const createServiceSchema = z.object({
    name: z
        .string()
        .min(2, 'Name muss mindestens 2 Zeichen haben')
        .max(100, 'Name darf maximal 100 Zeichen haben'),
    description: z
        .string()
        .max(500, 'Beschreibung darf maximal 500 Zeichen haben')
        .nullable()
        .optional(),
    duration: z
        .number()
        .int('Dauer muss eine ganze Zahl sein')
        .min(5, 'Mindestens 5 Minuten')
        .max(480, 'Maximal 8 Stunden'),
    price: z
        .number()
        .int('Preis muss in Cent angegeben werden')
        .min(0, 'Preis darf nicht negativ sein'),
    buffer_after: z
        .number()
        .int()
        .min(0)
        .max(60)
        .default(0),
    min_advance_hours: z
        .number()
        .int()
        .min(0, 'Mindestens 0 Stunden')
        .max(168, 'Maximal 7 Tage')
        .nullable()
        .optional(),
    max_advance_days: z
        .number()
        .int()
        .min(1, 'Mindestens 1 Tag')
        .max(365, 'Maximal 1 Jahr')
        .nullable()
        .optional(),
    is_active: z.boolean().default(true),
    online_booking_enabled: z.boolean().default(true),
    category_id: z.string().uuid().nullable().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>