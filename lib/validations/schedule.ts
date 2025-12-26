// lib/validations/schedule.ts

import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const normalizeTime = (value: unknown) => {
    if (typeof value !== 'string') {
        return value
    }

    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
    if (!match) {
        return value
    }

    return `${match[1]}:${match[2]}`
}

const timeField = z.preprocess(
    normalizeTime,
    z.string().regex(timeRegex, 'Format: HH:MM')
)

export const staffScheduleSchema = z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: timeField,
    end_time: timeField,
    break_start: z
        .union([
            timeField,
            z.string().length(0),
            z.null()
        ])
        .transform(val => (val === '' ? null : val))
        .nullable()
        .optional(),
    break_end: z
        .union([
            timeField,
            z.string().length(0),
            z.null()
        ])
        .transform(val => (val === '' ? null : val))
        .nullable()
        .optional(),
    is_working: z.boolean(),
})

export const updateStaffScheduleSchema = z.array(staffScheduleSchema)

export type StaffScheduleInput = z.infer<typeof staffScheduleSchema>