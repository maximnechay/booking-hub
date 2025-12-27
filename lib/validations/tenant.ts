// lib/validations/tenant.ts

import { z } from 'zod'

const slugRegex = /^[a-z0-9-]+$/

const emptyToNull = (value: unknown) => {
    if (typeof value !== 'string') {
        return value
    }

    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
}

export const updateTenantSchema = z.object({
    name: z.string().min(1, 'Required'),
    slug: z.string().regex(slugRegex, 'Only a-z, 0-9, and -'),
    email: z.string().email('Invalid email'),
    phone: z.preprocess(emptyToNull, z.string().nullable().optional()),
    address: z.preprocess(emptyToNull, z.string().nullable().optional()),
    logo_url: z.preprocess(emptyToNull, z.string().url('Invalid URL').nullable().optional()),
})

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
