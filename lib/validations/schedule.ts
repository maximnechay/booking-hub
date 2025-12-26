// lib/validations/schedule.ts

import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const staffScheduleSchema = z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(timeRegex, 'Format: HH:MM'),
    end_time: z.string().regex(timeRegex, 'Format: HH:MM'),
    break_start: z.string().regex(timeRegex).nullable().optional(),
    break_end: z.string().regex(timeRegex).nullable().optional(),
    is_working: z.boolean(),
})

export const updateStaffScheduleSchema = z.array(staffScheduleSchema)

export type StaffScheduleInput = z.infer<typeof staffScheduleSchema>