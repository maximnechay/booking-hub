import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params

    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('name, description')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!tenant) {
        return { title: 'Salon nicht gefunden' }
    }

    const title = `${tenant.name} — Online Termin buchen`
    const description =
        tenant.description ||
        `Buchen Sie Ihren Termin online bei ${tenant.name}. Schnell, einfach und rund um die Uhr verfügbar.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'BookingHub',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    }
}

export default function BookLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
