import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

const getTenantMeta = unstable_cache(
    async (slug: string) => {
        const { data } = await supabaseAdmin
            .from('tenants')
            .select('name, description')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()
        return data
    },
    ['tenant-meta'],
    { revalidate: 300 }
)

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params

    const tenant = await getTenantMeta(slug)

    if (!tenant) {
        return { title: 'Salon nicht gefunden' }
    }

    const title = `${tenant.name} — Online Termin buchen`
    const description =
        tenant.description ||
        `Buchen Sie Ihren Termin online bei ${tenant.name}. Schnell, einfach und rund um die Uhr verfügbar.`

    const ogImage = `/api/og/${slug}`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            siteName: 'BookingHub',
            images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
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
