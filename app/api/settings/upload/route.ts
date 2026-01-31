// app/api/settings/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const UPLOAD_TYPES = ['logo', 'cover'] as const

type UploadType = (typeof UPLOAD_TYPES)[number]

const FIELD_MAP: Record<UploadType, 'logo_url' | 'cover_image_url'> = {
    logo: 'logo_url',
    cover: 'cover_image_url',
}

// POST /api/settings/upload
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

        const ext = file.name.split('.').pop() || 'jpg'
        const filePath = `${userData.tenant_id}/${uploadType}.${ext}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('tenant-assets')
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
            .from('tenant-assets')
            .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl
        const versionedUrl = `${publicUrl}?v=${Date.now()}`

        const dbField = FIELD_MAP[uploadType as UploadType]
        const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({ [dbField]: versionedUrl })
            .eq('id', userData.tenant_id)

        if (updateError) {
            console.error('Tenant update error:', updateError)
            return NextResponse.json({ error: 'Failed to save URL' }, { status: 500 })
        }

        return NextResponse.json({ url: versionedUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/settings/upload — удалить изображение
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

        const { type } = await request.json()

        if (!type || !UPLOAD_TYPES.includes(type as UploadType)) {
            return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
        }

        const dbField = FIELD_MAP[type as UploadType]

        // Получаем текущий URL чтобы удалить файл из Storage
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('logo_url, cover_image_url')
            .eq('id', userData.tenant_id)
            .single()

        const currentUrl = tenant?.[dbField]
        if (currentUrl) {
            const storagePath = currentUrl.split('/tenant-assets/').pop()?.split('?')[0]
            if (storagePath) {
                await supabaseAdmin.storage.from('tenant-assets').remove([storagePath])
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({ [dbField]: null })
            .eq('id', userData.tenant_id)

        if (updateError) {
            console.error('Tenant update error:', updateError)
            return NextResponse.json({ error: 'Failed to remove image' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
