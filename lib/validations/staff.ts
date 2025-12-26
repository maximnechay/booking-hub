// lib/validations/staff.ts

import { z } from 'zod'

export const createStaffSchema = z.object({
    name: z
        .string()
        .min(2, 'Name muss mindestens 2 Zeichen haben')
        .max(100, 'Name darf maximal 100 Zeichen haben'),
    email: z
        .string()
        .email('Ungültige E-Mail-Adresse')
        .nullable()
        .optional(),
    phone: z
        .string()
        .max(50, 'Telefonnummer zu lang')
        .nullable()
        .optional(),
    is_active: z.boolean().default(true),
    service_ids: z
        .array(z.string().uuid('Ungültige Service-ID'))
        .optional(),
})

export const updateStaffSchema = createStaffSchema.partial()

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>