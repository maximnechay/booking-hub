import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

        if (!userData?.tenant_id || userData.role === 'staff') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Use PNG, JPEG or WebP' },
                { status: 400 }
            )
        }

        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Max 2MB' },
                { status: 400 }
            )
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${userData.tenant_id}/og-image.${fileExt}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from('og-images')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('og-images')
            .getPublicUrl(fileName)

        const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({
                og_image_url: publicUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userData.tenant_id)

        if (updateError) {
            console.error('Update error:', updateError)
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
        }

        return NextResponse.json({ success: true, og_image_url: publicUrl })
    } catch (error) {
        console.error('OG image upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE() {
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

        if (!userData?.tenant_id || userData.role === 'staff') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await supabaseAdmin.storage
            .from('og-images')
            .remove([
                `${userData.tenant_id}/og-image.png`,
                `${userData.tenant_id}/og-image.jpg`,
                `${userData.tenant_id}/og-image.jpeg`,
                `${userData.tenant_id}/og-image.webp`,
            ])

        await supabaseAdmin
            .from('tenants')
            .update({
                og_image_url: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userData.tenant_id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('OG image delete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
