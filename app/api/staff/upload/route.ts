// app/api/staff/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const UPLOAD_TYPES = ['avatar'] as const

type UploadType = (typeof UPLOAD_TYPES)[number]

const BUCKET = 'tenant-assets'

const getStoragePathFromUrl = (url: string) => {
    const marker = `/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.slice(idx + marker.length)
}

const ensureStaffInTenant = async (staffId: string, tenantId: string) => {
    const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('id, avatar_url')
        .eq('id', staffId)
        .eq('tenant_id', tenantId)
        .single()

    return staff
}

// POST /api/staff/upload
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        if (userData.role === 'staff') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const uploadType = formData.get('type') as string | null
        const staffId = formData.get('staff_id') as string | null

        if (!uploadType || !UPLOAD_TYPES.includes(uploadType as UploadType)) {
            return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 })
        }

        if (staffId) {
            const staff = await ensureStaffInTenant(staffId, userData.tenant_id)
            if (!staff) {
                return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
            }
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const filename = staffId ? `${staffId}.${ext}` : `${crypto.randomUUID()}.${ext}`
        const filePath = `${userData.tenant_id}/staff/${filename}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
        }

        const { data: urlData } = supabaseAdmin
            .storage
            .from(BUCKET)
            .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        if (staffId) {
            const { error: updateError } = await supabaseAdmin
                .from('staff')
                .update({ avatar_url: publicUrl })
                .eq('id', staffId)
                .eq('tenant_id', userData.tenant_id)

            if (updateError) {
                console.error('Staff update error:', updateError)
                return NextResponse.json({ error: 'Failed to save URL' }, { status: 500 })
            }
        }

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        console.error('Staff upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/staff/upload
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!userData?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        if (userData.role === 'staff') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { type, staff_id, url } = await request.json()

        if (!type || !UPLOAD_TYPES.includes(type as UploadType)) {
            return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
        }

        let currentUrl = url as string | undefined
        if (staff_id) {
            const staff = await ensureStaffInTenant(staff_id, userData.tenant_id)
            if (!staff) {
                return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
            }
            currentUrl = staff.avatar_url || undefined
        }

        if (currentUrl) {
            const storagePath = getStoragePathFromUrl(currentUrl)
            if (storagePath) {
                await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
            }
        }

        if (staff_id) {
            const { error: updateError } = await supabaseAdmin
                .from('staff')
                .update({ avatar_url: null })
                .eq('id', staff_id)
                .eq('tenant_id', userData.tenant_id)

            if (updateError) {
                console.error('Staff update error:', updateError)
                return NextResponse.json({ error: 'Failed to remove image' }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Staff delete upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
