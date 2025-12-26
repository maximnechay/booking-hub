// lib/validations/categories.ts

import { z } from 'zod'

export const createCategorySchema = z.object({
    parent_id: z.string().uuid().nullable().optional(),
    name: z
        .string()
        .min(2, 'Name muss mindestens 2 Zeichen haben')
        .max(100, 'Name darf maximal 100 Zeichen haben'),
    description: z.string().max(255).nullable().optional(),
    icon: z.string().max(50).nullable().optional(),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>