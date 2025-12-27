// lib/validations/working-hours.ts

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

export const workingHourSchema = z.object({
    day_of_week: z.number().int().min(0).max(6),
    open_time: timeField,
    close_time: timeField,
    is_open: z.boolean(),
})

export const updateWorkingHoursSchema = z.array(workingHourSchema)

export type WorkingHourInput = z.infer<typeof workingHourSchema>
