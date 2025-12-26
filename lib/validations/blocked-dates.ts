// lib/validations/blocked-dates.ts

import { z } from 'zod'

export const createBlockedDateSchema = z.object({
    staff_id: z.string().uuid().nullable().optional(),
    blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    reason: z.string().max(255).nullable().optional(),
})

export const createBlockedDateRangeSchema = z.object({
    staff_id: z.string().uuid().nullable().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    reason: z.string().max(255).nullable().optional(),
})

export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>
export type CreateBlockedDateRangeInput = z.infer<typeof createBlockedDateRangeSchema>