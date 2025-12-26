// lib/validations/variants.ts

import { z } from 'zod'

export const createVariantSchema = z.object({
    name: z
        .string()
        .min(2, 'Name muss mindestens 2 Zeichen haben')
        .max(100, 'Name darf maximal 100 Zeichen haben'),
    description: z.string().max(255).nullable().optional(),
    duration: z
        .number()
        .int()
        .min(5, 'Mindestens 5 Minuten')
        .max(480, 'Maximal 8 Stunden'),
    price: z
        .number()
        .int()
        .min(0, 'Preis darf nicht negativ sein'),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
})

export const updateVariantSchema = createVariantSchema.partial()

export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>